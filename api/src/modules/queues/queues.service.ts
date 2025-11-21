import { Injectable, NotFoundException } from '@nestjs/common';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import { PbsQueue } from '@/modules/data-collection/types/pbs.types';
import { QueueListDTO, QueuesListDTO } from './dto/queue-list.dto';
import {
  QueueDetailDTO,
  QueueStateCountDTO,
  QueueAclDTO,
  QueueResourcesDTO,
} from './dto/queue-detail.dto';
import { UserContext, UserRole } from '@/common/types/user-context.types';

// Re-export for convenience
export type { UserContext };

@Injectable()
export class QueuesService {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  /**
   * Get list of all queues in hierarchical structure
   */
  getQueuesList(userContext: UserContext): QueuesListDTO {
    const pbsData = this.dataCollectionService.getPbsData();

    if (!pbsData?.queues?.items) {
      return {
        queues: [],
      };
    }

    const queues = pbsData.queues.items;

    // Build queue map and parent-child relationships
    const queueMap = new Map<string, PbsQueue>();
    const parentMap = new Map<string, string[]>(); // child -> parents
    const childMap = new Map<string, string[]>(); // parent -> children

    // Build maps
    for (const queue of queues) {
      queueMap.set(queue.name, queue);

      if (queue.attributes.queue_type === 'Route') {
        const destinations = this.parseRouteDestinations(queue);
        for (const destination of destinations) {
          // Add parent relationship
          if (!parentMap.has(destination)) {
            parentMap.set(destination, []);
          }
          parentMap.get(destination)!.push(queue.name);

          // Add child relationship
          if (!childMap.has(queue.name)) {
            childMap.set(queue.name, []);
          }
          childMap.get(queue.name)!.push(destination);
        }
      }
    }

    // Find root queues (queues with no Route queue parents)
    const rootQueues: PbsQueue[] = [];
    for (const queue of queues) {
      const parents = parentMap.get(queue.name) || [];
      // Check if any parent is a Route queue
      const hasRouteParent = parents.some((parentName) => {
        const parentQueue = queueMap.get(parentName);
        return parentQueue?.attributes.queue_type === 'Route';
      });

      // Root queue if it's a Route queue with no Route parents, or Execution queue with no Route parents
      if (!hasRouteParent) {
        rootQueues.push(queue);
      }
    }

    // Build hierarchical structure recursively
    const buildQueueTree = (queue: PbsQueue): QueueListDTO => {
      const children = childMap.get(queue.name) || [];
      const childQueues = children
        .map((childName) => queueMap.get(childName))
        .filter((q): q is PbsQueue => q !== undefined)
        .map((q) => buildQueueTree(q));

      // Sort children: Route queues first, then by priority (higher first), then by name
      childQueues.sort((a, b) => {
        if (a.queueType !== b.queueType) {
          return a.queueType === 'Route' ? -1 : 1;
        }
        const priorityA = a.priority ?? 0;
        const priorityB = b.priority ?? 0;
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        return a.name.localeCompare(b.name);
      });

      return this.mapQueueToList(queue, userContext, childQueues);
    };

    // Build tree for each root queue
    const rootQueueDTOs = rootQueues.map((queue) => buildQueueTree(queue));

    // Sort root queues: Route queues first, then by priority (higher first), then by name
    rootQueueDTOs.sort((a, b) => {
      if (a.queueType !== b.queueType) {
        return a.queueType === 'Route' ? -1 : 1;
      }
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      queues: rootQueueDTOs,
    };
  }

  /**
   * Get queue detail by name
   */
  getQueueDetail(name: string, userContext: UserContext): QueueDetailDTO {
    const pbsData = this.dataCollectionService.getPbsData();

    if (!pbsData?.queues?.items) {
      throw new NotFoundException(`Queue '${name}' was not found`);
    }

    const queue = pbsData.queues.items.find((q) => q.name === name);

    if (!queue) {
      throw new NotFoundException(`Queue '${name}' was not found`);
    }

    const queues = pbsData.queues.items;

    // Build parent-child relationships
    const queueMap = new Map<string, PbsQueue>();
    const parentMap = new Map<string, string[]>();
    const childMap = new Map<string, string[]>();

    for (const q of queues) {
      queueMap.set(q.name, q);

      if (q.attributes.queue_type === 'Route') {
        const destinations = this.parseRouteDestinations(q);
        for (const destination of destinations) {
          if (!parentMap.has(destination)) {
            parentMap.set(destination, []);
          }
          parentMap.get(destination)!.push(q.name);

          if (!childMap.has(q.name)) {
            childMap.set(q.name, []);
          }
          childMap.get(q.name)!.push(destination);
        }
      }
    }

    const parents = parentMap.get(queue.name) || [];
    const childNames = childMap.get(queue.name) || [];

    // Build children recursively
    const buildChildDetail = (childName: string): QueueDetailDTO => {
      const childQueue = queueMap.get(childName);
      if (!childQueue) {
        throw new NotFoundException(`Child queue '${childName}' was not found`);
      }
      const childParents = parentMap.get(childName) || [];
      const childChildNames = childMap.get(childName) || [];
      const childChildren = childChildNames
        .map((name) => queueMap.get(name))
        .filter((q): q is PbsQueue => q !== undefined)
        .map((q) => buildChildDetail(q.name));

      return this.mapQueueToDetail(
        childQueue,
        userContext,
        childParents,
        childChildNames,
        queueMap,
        childChildren,
      );
    };

    const children = childNames
      .map((childName) => queueMap.get(childName))
      .filter((q): q is PbsQueue => q !== undefined)
      .map((q) => buildChildDetail(q.name));

    // Sort children
    children.sort((a, b) => {
      if (a.queueType !== b.queueType) {
        return a.queueType === 'Route' ? -1 : 1;
      }
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      return a.name.localeCompare(b.name);
    });

    return this.mapQueueToDetail(
      queue,
      userContext,
      parents,
      childNames,
      queueMap,
      children,
    );
  }

  /**
   * Parse route destinations from queue attributes
   */
  private parseRouteDestinations(queue: PbsQueue): string[] {
    const destinations = queue.attributes.route_destinations;
    if (!destinations) {
      return [];
    }
    return destinations
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  }

  /**
   * Map PBS queue to list DTO with children
   */
  private mapQueueToList(
    queue: PbsQueue,
    userContext: UserContext,
    children: QueueListDTO[] = [],
  ): QueueListDTO {
    const priority = queue.attributes.Priority
      ? parseInt(queue.attributes.Priority, 10)
      : null;

    const totalJobs = queue.attributes.total_jobs
      ? parseInt(queue.attributes.total_jobs, 10)
      : null;

    const minWalltime = queue.attributes['resources_min.walltime'] || null;
    const maxWalltime = queue.attributes['resources_max.walltime'] || null;

    const enabled = queue.attributes.enabled === 'True';
    const started = queue.attributes.started === 'True';

    const hasAccess = this.checkQueueAccess(queue, userContext);

    const stateCount = this.parseStateCount(queue.attributes.state_count);

    const fairshare = queue.attributes.fairshare_tree || null;

    // Parse max_run format: "[u:PBS_GENERIC=5]" -> extract 5
    let maximumForUser: number | null = null;
    if (queue.attributes.max_run) {
      const match = queue.attributes.max_run.match(/=\s*(\d+)/);
      if (match) {
        maximumForUser = parseInt(match[1], 10);
      }
    }

    return {
      name: queue.name,
      queueType: queue.attributes.queue_type as 'Execution' | 'Route',
      priority,
      totalJobs,
      stateCount,
      fairshare,
      maximumForUser,
      minWalltime,
      maxWalltime,
      enabled,
      started,
      hasAccess,
      children: children.length > 0 ? children : undefined,
    };
  }

  /**
   * Map PBS queue to detail DTO with children and parents
   */
  private mapQueueToDetail(
    queue: PbsQueue,
    userContext: UserContext,
    parents: string[] = [],
    childNames: string[] = [],
    queueMap?: Map<string, PbsQueue>,
    children?: QueueDetailDTO[],
  ): QueueDetailDTO {
    const priority = queue.attributes.Priority
      ? parseInt(queue.attributes.Priority, 10)
      : null;

    const totalJobs = queue.attributes.total_jobs
      ? parseInt(queue.attributes.total_jobs, 10)
      : null;

    const enabled = queue.attributes.enabled === 'True';
    const started = queue.attributes.started === 'True';

    const stateCount = this.parseStateCount(queue.attributes.state_count);
    const acl = this.parseAcl(queue);
    const resources = this.parseResources(queue);

    // Get additional attributes (exclude already mapped ones)
    const excludedKeys = new Set([
      'queue_type',
      'Priority',
      'total_jobs',
      'state_count',
      'enabled',
      'started',
      'route_destinations',
      'acl_user_enable',
      'acl_users',
      'acl_group_enable',
      'acl_groups',
      'acl_host_enable',
      'acl_hosts',
      'resources_min.mem',
      'resources_min.ncpus',
      'resources_min.ngpus',
      'resources_min.walltime',
      'resources_max.ncpus',
      'resources_max.ngpus',
      'resources_max.walltime',
      'resources_default.walltime',
      'resources_default.ncpus',
      'resources_default.ngpus',
      'resources_assigned.mem',
      'resources_assigned.ncpus',
      'resources_assigned.ngpus',
      'resources_assigned.nodect',
    ]);

    const additionalAttributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(queue.attributes)) {
      if (!excludedKeys.has(key)) {
        additionalAttributes[key] = value;
      }
    }

    return {
      name: queue.name,
      queueType: queue.attributes.queue_type as 'Execution' | 'Route',
      priority,
      totalJobs,
      stateCount,
      enabled,
      started,
      hasAccess: this.checkQueueAccess(queue, userContext),
      acl,
      resources,
      children: children && children.length > 0 ? children : null,
      parents: parents.length > 0 ? parents : null,
      additionalAttributes:
        Object.keys(additionalAttributes).length > 0
          ? additionalAttributes
          : null,
    };
  }

  /**
   * Parse state count from state_count string
   * Format: "Transit:0 Queued:0 Held:0 Waiting:0 Running:0 Exiting:0 Begun:0 "
   */
  private parseStateCount(stateCountStr?: string): QueueStateCountDTO | null {
    if (!stateCountStr) {
      return null;
    }

    const parseValue = (prefix: string): number => {
      const regex = new RegExp(`${prefix}:(\\d+)`);
      const match = stateCountStr.match(regex);
      return match ? parseInt(match[1], 10) : 0;
    };

    return {
      transit: parseValue('Transit'),
      queued: parseValue('Queued'),
      held: parseValue('Held'),
      waiting: parseValue('Waiting'),
      running: parseValue('Running'),
      exiting: parseValue('Exiting'),
      begun: parseValue('Begun'),
    };
  }

  /**
   * Parse ACL information from queue attributes
   */
  private parseAcl(queue: PbsQueue): QueueAclDTO | null {
    const userEnable = queue.attributes.acl_user_enable === 'True';
    const groupEnable = queue.attributes.acl_group_enable === 'True';
    const hostEnable = queue.attributes.acl_host_enable === 'True';

    if (!userEnable && !groupEnable && !hostEnable) {
      return null;
    }

    const acl: QueueAclDTO = {};

    if (userEnable && queue.attributes.acl_users) {
      acl.users = queue.attributes.acl_users.split(',').map((u) => u.trim());
    }

    if (groupEnable && queue.attributes.acl_groups) {
      acl.groups = queue.attributes.acl_groups.split(',').map((g) => g.trim());
    }

    if (hostEnable && queue.attributes.acl_hosts) {
      acl.hosts = queue.attributes.acl_hosts.split(',').map((h) => h.trim());
    }

    return acl;
  }

  /**
   * Parse resource information from queue attributes
   */
  private parseResources(queue: PbsQueue): QueueResourcesDTO | null {
    const resources: QueueResourcesDTO = {};

    if (queue.attributes['resources_min.mem']) {
      resources.minMem = queue.attributes['resources_min.mem'];
    }
    if (queue.attributes['resources_min.ncpus']) {
      resources.minNcpus = queue.attributes['resources_min.ncpus'];
    }
    if (queue.attributes['resources_min.ngpus']) {
      resources.minNgpus = queue.attributes['resources_min.ngpus'];
    }
    if (queue.attributes['resources_min.walltime']) {
      resources.minWalltime = queue.attributes['resources_min.walltime'];
    }
    if (queue.attributes['resources_max.ncpus']) {
      resources.maxNcpus = queue.attributes['resources_max.ncpus'];
    }
    if (queue.attributes['resources_max.ngpus']) {
      resources.maxNgpus = queue.attributes['resources_max.ngpus'];
    }
    if (queue.attributes['resources_max.walltime']) {
      resources.maxWalltime = queue.attributes['resources_max.walltime'];
    }
    if (queue.attributes['resources_default.walltime']) {
      resources.defaultWalltime =
        queue.attributes['resources_default.walltime'];
    }
    if (queue.attributes['resources_default.ncpus']) {
      resources.defaultNcpus = queue.attributes['resources_default.ncpus'];
    }
    if (queue.attributes['resources_default.ngpus']) {
      resources.defaultNgpus = queue.attributes['resources_default.ngpus'];
    }
    if (queue.attributes['resources_assigned.mem']) {
      resources.assignedMem = queue.attributes['resources_assigned.mem'];
    }
    if (queue.attributes['resources_assigned.ncpus']) {
      resources.assignedNcpus = queue.attributes['resources_assigned.ncpus'];
    }
    if (queue.attributes['resources_assigned.ngpus']) {
      resources.assignedNgpus = queue.attributes['resources_assigned.ngpus'];
    }
    if (queue.attributes['resources_assigned.nodect']) {
      resources.assignedNodect = queue.attributes['resources_assigned.nodect'];
    }

    return Object.keys(resources).length > 0 ? resources : null;
  }

  /**
   * Check if user has access to the queue based on ACLs
   * Admin role has access to everything
   */
  private checkQueueAccess(queue: PbsQueue, userContext: UserContext): boolean {
    // Admin has access to everything
    if (userContext.role === UserRole.ADMIN) {
      return true;
    }

    const userEnable = queue.attributes.acl_user_enable === 'True';
    const groupEnable = queue.attributes.acl_group_enable === 'True';
    const hostEnable = queue.attributes.acl_host_enable === 'True';

    // If no ACL is enabled, queue is accessible to everyone
    if (!userEnable && !groupEnable && !hostEnable) {
      return true;
    }

    // Check user ACL
    if (userEnable) {
      const allowedUsers = queue.attributes.acl_users
        ? queue.attributes.acl_users.split(',').map((u) => u.trim())
        : [];

      // Check if username matches (handle @domain format)
      const username = userContext.username.split('@')[0];
      if (
        allowedUsers.some((u) => {
          const allowedUser = u.split('@')[0];
          return allowedUser === username;
        })
      ) {
        return true;
      }
    }

    // Check group ACL
    if (groupEnable && userContext.groups && userContext.groups.length > 0) {
      const allowedGroups = queue.attributes.acl_groups
        ? queue.attributes.acl_groups.split(',').map((g) => g.trim())
        : [];

      if (userContext.groups.some((group) => allowedGroups.includes(group))) {
        return true;
      }
    }

    // Check host ACL
    if (hostEnable && userContext.hostname) {
      const allowedHosts = queue.attributes.acl_hosts
        ? queue.attributes.acl_hosts.split(',').map((h) => h.trim())
        : [];

      if (
        allowedHosts.some((host) => {
          // Simple hostname matching (can be extended for wildcards)
          return (
            host === userContext.hostname ||
            userContext.hostname?.endsWith(host)
          );
        })
      ) {
        return true;
      }
    }

    // If ACL is enabled but no match found, deny access
    return false;
  }
}
