import { Injectable, NotFoundException } from '@nestjs/common';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import {
  PerunPhysicalMachine,
  PerunResource,
  PerunMachine,
} from '@/modules/data-collection/types/perun.types';
import {
  InfrastructureOrganizationListDTO,
  InfrastructureClusterListDTO,
  InfrastructureNodeListDTO,
  NodeState,
} from './dto/infrastructure-list.dto';
import {
  InfrastructureDetailDTO,
  InfrastructureOrganizationDetailDTO,
  InfrastructureClusterDetailDTO,
  InfrastructureNodeDetailDTO,
} from './dto/infrastructure-detail.dto';
import { InfrastructureListMetaDto } from './dto/infrastructure-list-meta.dto';
import { PbsNode, PbsQueue } from '@/modules/data-collection/types/pbs.types';
import { QueueListDTO } from '@/modules/queues/dto/queue-list.dto';

@Injectable()
export class InfrastructureService {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  /**
   * Get list of all infrastructure (limited data) with statistics
   */
  getInfrastructureList(): {
    data: InfrastructureOrganizationListDTO[];
    meta: InfrastructureListMetaDto;
  } {
    const perunData = this.dataCollectionService.getPerunData();

    if (!perunData?.machines?.physical_machines) {
      return {
        data: [],
        meta: this.createEmptyMeta(),
      };
    }

    const data = perunData.machines.physical_machines.map((org) =>
      this.mapOrganizationToList(org),
    );

    const meta = this.calculateStatistics(data);

    return { data, meta };
  }

  /**
   * Calculate statistics from infrastructure list
   */
  private calculateStatistics(
    organizations: InfrastructureOrganizationListDTO[],
  ): InfrastructureListMetaDto {
    let totalClusters = 0;
    let totalNodes = 0;
    let totalCpu = 0;
    let freeNodes = 0;
    let partiallyUsedNodes = 0;
    let usedNodes = 0;
    let unknownNodes = 0;

    const pbsData = this.dataCollectionService.getPbsData();

    // Helper function to find PBS node by PERUN machine name
    const findPbsNode = (perunNodeName: string): PbsNode | undefined => {
      if (!pbsData?.servers) {
        return undefined;
      }

      // PERUN machine names are FQDNs (e.g., "alfrid1.meta.zcu.cz")
      // PBS node names are short hostnames (e.g., "alfrid1")
      // Extract hostname from PERUN name for matching
      const perunHostname = perunNodeName.split('.')[0];

      // Find node across all servers
      for (const serverData of Object.values(pbsData.servers)) {
        if (serverData.nodes?.items) {
          // Try exact match first
          let pbsNode = serverData.nodes.items.find(
            (node) => node.name === perunNodeName,
          );
          if (pbsNode) {
            return pbsNode;
          }
          // Try hostname match (PERUN FQDN vs PBS short name)
          pbsNode = serverData.nodes.items.find(
            (node) => node.name === perunHostname,
          );
          if (pbsNode) {
            return pbsNode;
          }
          // Try matching against PBS host attribute (full hostname)
          pbsNode = serverData.nodes.items.find(
            (node) =>
              node.attributes['resources_available.host'] === perunNodeName ||
              node.attributes['resources_available.vnode'] === perunNodeName ||
              node.attributes['resources_available.host']?.split('.')[0] ===
                perunHostname,
          );
          if (pbsNode) {
            return pbsNode;
          }
        }
      }
      return undefined;
    };

    // Calculate totals and GPU/memory from PBS
    let totalGpu = 0;
    let totalMemory = 0;

    for (const org of organizations) {
      totalClusters += org.clusters.length;
      for (const cluster of org.clusters) {
        totalNodes += cluster.nodes.length;
        totalCpu += cluster.totalCpu;

        for (const node of cluster.nodes) {
          // Count node states
          if (node.actualState === NodeState.FREE) {
            freeNodes++;
          } else if (node.actualState === NodeState.PARTIALLY_USED) {
            partiallyUsedNodes++;
          } else if (node.actualState === NodeState.USED) {
            usedNodes++;
          } else {
            unknownNodes++;
          }

          // Get GPU and memory from PBS if available
          const pbsNode = findPbsNode(node.name);
          if (pbsNode) {
            const availableGpus = parseInt(
              pbsNode.attributes['resources_available.ngpus'] || '0',
              10,
            );
            totalGpu += availableGpus;

            // Parse memory (format: "515862mb", "1536 GiB", etc.)
            const memoryStr =
              pbsNode.attributes['resources_available.mem'] || '0';
            // Match patterns like "515862mb", "1536 GiB", "1024KB", etc.
            const memoryMatch = memoryStr.match(/^(\d+)\s*([a-z]+)$/i);
            if (memoryMatch) {
              const value = parseInt(memoryMatch[1], 10);
              const unit = memoryMatch[2].toLowerCase();
              // Convert to bytes for consistency
              let bytes = value;
              if (unit === 'b' || unit === 'bytes') {
                bytes = value;
              } else if (unit === 'kb' || unit === 'k') {
                bytes = value * 1024;
              } else if (unit === 'mb' || unit === 'm') {
                bytes = value * 1024 * 1024;
              } else if (unit === 'gb' || unit === 'g' || unit === 'gib') {
                bytes = value * 1024 * 1024 * 1024;
              } else if (unit === 'tb' || unit === 't' || unit === 'tib') {
                bytes = value * 1024 * 1024 * 1024 * 1024;
              }
              totalMemory += bytes;
            } else {
              // Try to parse as just a number (assume bytes)
              const numValue = parseInt(memoryStr, 10);
              if (!isNaN(numValue)) {
                totalMemory += numValue;
              }
            }
          }
        }
      }
    }

    return {
      totalCount: organizations.length,
      totalOrganizations: organizations.length,
      totalClusters,
      totalNodes,
      totalCpu,
      totalGpu: totalGpu,
      totalMemory: totalMemory,
      freeNodes,
      partiallyUsedNodes,
      usedNodes,
      unknownNodes,
    };
  }

  /**
   * Create empty meta for empty data
   */
  private createEmptyMeta(): InfrastructureListMetaDto {
    return {
      totalCount: 0,
      totalOrganizations: 0,
      totalClusters: 0,
      totalNodes: 0,
      totalCpu: 0,
      totalGpu: 0,
      totalMemory: 0,
      freeNodes: 0,
      partiallyUsedNodes: 0,
      usedNodes: 0,
      unknownNodes: 0,
    };
  }

  /**
   * Get organization detail by ID
   */
  getOrganizationDetail(orgId: string): InfrastructureDetailDTO {
    const perunData = this.dataCollectionService.getPerunData();

    if (!perunData?.machines?.physical_machines) {
      throw new NotFoundException(
        `Organization with id '${orgId}' was not found`,
      );
    }

    const org = perunData.machines.physical_machines.find(
      (o) => o.id === orgId,
    );
    if (!org) {
      throw new NotFoundException(
        `Organization with id '${orgId}' was not found`,
      );
    }
    return this.mapOrganizationToDetail(org);
  }

  /**
   * Get cluster detail by ID
   */
  getClusterDetail(clusterId: string): InfrastructureDetailDTO {
    const perunData = this.dataCollectionService.getPerunData();

    if (!perunData?.machines?.physical_machines) {
      throw new NotFoundException(
        `Cluster with id '${clusterId}' was not found`,
      );
    }

    const cluster = this.findCluster(
      clusterId,
      perunData.machines.physical_machines,
    );
    if (!cluster) {
      throw new NotFoundException(
        `Cluster with id '${clusterId}' was not found`,
      );
    }
    return this.mapClusterToDetail(cluster);
  }

  /**
   * Get machine (node) detail by node name
   * @param nodeName - The node name (can be full FQDN or just hostname)
   */
  getMachineDetail(nodeName: string): InfrastructureDetailDTO {
    const perunData = this.dataCollectionService.getPerunData();

    if (!perunData?.machines?.physical_machines) {
      throw new NotFoundException(`Machine '${nodeName}' was not found`);
    }

    const node = this.findNodeByName(
      nodeName,
      perunData.machines.physical_machines,
    );
    if (!node) {
      throw new NotFoundException(`Machine '${nodeName}' was not found`);
    }
    return this.mapNodeToDetail(node);
  }

  /**
   * Get infrastructure detail by ID (deprecated - use specific methods instead)
   * ID format: organization-{id}, cluster-{id}, node-{clusterId}-{nodeName}
   * @deprecated Use getOrganizationDetail, getClusterDetail, or getMachineDetail instead
   */
  getInfrastructureDetail(id: string): InfrastructureDetailDTO {
    const perunData = this.dataCollectionService.getPerunData();

    if (!perunData?.machines?.physical_machines) {
      throw new NotFoundException(
        `Infrastructure with id '${id}' was not found`,
      );
    }

    // Parse ID to determine type
    if (id.startsWith('organization-')) {
      const orgId = id.replace('organization-', '');
      return this.getOrganizationDetail(orgId);
    }

    if (id.startsWith('cluster-')) {
      const clusterId = id.replace('cluster-', '');
      return this.getClusterDetail(clusterId);
    }

    if (id.startsWith('node-')) {
      const parts = id.replace('node-', '').split('-');
      if (parts.length < 2) {
        throw new NotFoundException(`Invalid node ID format: '${id}'`);
      }
      const nodeName = parts.slice(1).join('-');
      return this.getMachineDetail(nodeName);
    }

    throw new NotFoundException(`Infrastructure with id '${id}' was not found`);
  }

  /**
   * Map organization to list DTO
   */
  private mapOrganizationToList(
    org: PerunPhysicalMachine,
  ): InfrastructureOrganizationListDTO {
    let totalNodes = 0;
    const clusters = (org.resources || []).map((resource) => {
      const machines = resource.machines || [];
      const nodes = machines.map((machine) =>
        this.mapNodeToList(machine, resource.id),
      );
      totalNodes += nodes.length;
      return {
        id: resource.id,
        name: resource.name,
        cluster: resource.cluster,
        totalCpu: machines.reduce((sum, m) => sum + m.cpu, 0),
        nodeCount: nodes.length,
        nodes,
      } as InfrastructureClusterListDTO;
    });

    return {
      id: org.id,
      name: org.name,
      clusterCount: clusters.length,
      clusters,
    };
  }

  /**
   * Map organization to detail DTO
   */
  private mapOrganizationToDetail(
    org: PerunPhysicalMachine,
  ): InfrastructureDetailDTO {
    const resources = (org.resources || []).map((resource) =>
      this.mapClusterToDetailDTO(resource),
    );

    const orgDetail: InfrastructureOrganizationDetailDTO = {
      id: org.id,
      name: org.name,
      resources,
    };

    return {
      type: 'Organization',
      id: org.id,
      name: org.name,
      organization: orgDetail,
      cluster: null,
      node: null,
    };
  }

  /**
   * Map cluster to detail DTO
   */
  private mapClusterToDetail(cluster: {
    resource: PerunResource;
    orgId: string;
  }): InfrastructureDetailDTO {
    const clusterDetail = this.mapClusterToDetailDTO(cluster.resource);

    return {
      type: 'Cluster',
      id: cluster.resource.id,
      name: cluster.resource.name,
      organization: null,
      cluster: clusterDetail,
      node: null,
    };
  }

  /**
   * Map cluster resource to detail DTO
   */
  private mapClusterToDetailDTO(
    resource: PerunResource,
  ): InfrastructureClusterDetailDTO {
    const machines = (resource.machines || []).map((machine) =>
      this.mapNodeToDetailDTO(machine, resource.id),
    );

    return {
      id: resource.id,
      name: resource.name,
      cluster: resource.cluster,
      desc: resource.desc,
      spec: resource.spec,
      cpudesc: resource.cpudesc,
      gpudesc: resource.gpudesc,
      photo: resource.photo,
      thumbnail: resource.thumbnail,
      memory: resource.memory,
      disk: resource.disk,
      network: resource.network,
      comment: resource.comment,
      owner: resource.owner,
      vos: resource.vos,
      machines,
    };
  }

  /**
   * Map node to detail DTO
   */
  private mapNodeToDetail(node: {
    machine: PerunMachine;
    clusterId: string;
  }): InfrastructureDetailDTO {
    const nodeDetail = this.mapNodeToDetailDTO(node.machine, node.clusterId);

    return {
      type: 'Node',
      id: `node-${node.clusterId}-${node.machine.name}`,
      name: node.machine.name,
      organization: null,
      cluster: null,
      node: nodeDetail,
    };
  }

  /**
   * Map node machine to list DTO
   */
  private mapNodeToList(
    machine: PerunMachine,
    clusterId: string,
  ): InfrastructureNodeListDTO {
    const pbsState = this.getNodeStateFromPbs(machine.name);

    return {
      name: machine.name,
      cpu: machine.cpu,
      actualState: pbsState.state,
      cpuUsagePercent: pbsState.cpuUsage,
      gpuUsagePercent: pbsState.gpuUsage,
      gpuCount: pbsState.gpuCount,
      gpuAssigned: pbsState.gpuAssigned,
      gpuCapability: pbsState.gpuCapability,
      gpuMemory: pbsState.gpuMemory,
      cudaVersion: pbsState.cudaVersion,
      memoryTotal: pbsState.memoryTotal,
      memoryUsed: pbsState.memoryUsed,
      memoryUsagePercent: pbsState.memoryUsagePercent,
    };
  }

  /**
   * Map node machine to detail DTO
   */
  private mapNodeToDetailDTO(
    machine: PerunMachine,
    clusterId: string,
  ): InfrastructureNodeDetailDTO {
    const pbsState = this.getNodeStateFromPbs(machine.name);
    const pbsNodeData = this.getPbsNodeData(machine.name);

    // Parse jobs from node's jobs attribute
    const jobs: string[] = [];
    if (pbsNodeData?.pbsNode?.attributes?.jobs) {
      const jobsStr = pbsNodeData.pbsNode.attributes.jobs;
      // Jobs format: "14490844.pbs-m1.metacentrum.cz/0, 14571383[170].pbs-m1.metacentrum.cz/..."
      const jobList = jobsStr.split(',').map((j) => j.trim());
      jobs.push(...jobList);
    }

    // Parse queues from queue_list attribute and build QueueListDTO objects
    const queues: QueueListDTO[] = [];
    if (
      pbsNodeData?.pbsNode?.attributes['resources_available.queue_list'] &&
      pbsNodeData.serverName
    ) {
      const queuesStr =
        pbsNodeData.pbsNode.attributes['resources_available.queue_list'];
      // Queues format: "q_2h,q_4h,q_1d,q_gpu,..."
      const queueNames = queuesStr.split(',').map((q) => q.trim());

      // Get PBS data to find queue objects
      const pbsData = this.dataCollectionService.getPbsData();
      const serverData = pbsData?.servers?.[pbsNodeData.serverName];

      if (serverData?.queues?.items) {
        for (const queueName of queueNames) {
          const pbsQueue = serverData.queues.items.find(
            (q) => q.name === queueName,
          );
          if (pbsQueue) {
            const queueDTO = this.mapPbsQueueToList(
              pbsQueue,
              pbsNodeData.serverName,
            );
            queues.push(queueDTO);
          }
        }
      }
    }

    const rawPbsAttributes = pbsNodeData?.pbsNode?.attributes || null;

    const outages: Array<Record<string, any>> = [];

    const pbsData = pbsNodeData?.pbsNode
      ? {
          name: pbsNodeData.pbsNode.name,
          actualState: pbsState.state,
          cpuUsagePercent: pbsState.cpuUsage,
          gpuUsagePercent: pbsState.gpuUsage,
          gpuCount: pbsState.gpuCount,
          gpuAssigned: pbsState.gpuAssigned,
          gpuCapability: pbsState.gpuCapability,
          gpuMemory: pbsState.gpuMemory,
          cudaVersion: pbsState.cudaVersion,
          memoryTotal: pbsState.memoryTotal,
          memoryUsed: pbsState.memoryUsed,
          memoryUsagePercent: pbsState.memoryUsagePercent,
          jobs: jobs.length > 0 ? jobs : null,
          queues: queues.length > 0 ? queues : null,
          rawPbsAttributes,
          outages: outages.length > 0 ? outages : null,
        }
      : null;

    return {
      name: machine.name,
      cpu: machine.cpu,
      pbs: pbsData,
    };
  }

  private mapPbsQueueToList(queue: PbsQueue, serverName: string): QueueListDTO {
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

    // Parse state_count
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
      server: serverName,
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
      hasAccess: true, // Default to true since we don't have user context
    };
  }

  private parseStateCount(stateCountStr?: string): QueueListDTO['stateCount'] {
    if (!stateCountStr) {
      return null;
    }

    const counts: Record<string, number> = {};
    const parts = stateCountStr.split(/\s+/);
    for (const part of parts) {
      const [state, count] = part.split(':');
      if (state && count) {
        counts[state.toLowerCase()] = parseInt(count, 10) || 0;
      }
    }

    return {
      transit: counts.transit || 0,
      queued: counts.queued || 0,
      held: counts.held || 0,
      waiting: counts.waiting || 0,
      running: counts.running || 0,
      exiting: counts.exiting || 0,
      begun: counts.begun || 0,
    };
  }

  private getPbsNodeData(nodeName: string): {
    pbsNode: PbsNode | null;
    serverName: string | null;
  } {
    const pbsData = this.dataCollectionService.getPbsData();

    if (!pbsData?.servers) {
      return { pbsNode: null, serverName: null };
    }

    const perunHostname = nodeName.split('.')[0];

    for (const [serverName, serverData] of Object.entries(pbsData.servers)) {
      if (serverData.nodes?.items) {
        // Try exact match first
        let pbsNode = serverData.nodes.items.find(
          (node) => node.name === nodeName,
        );
        if (pbsNode) {
          return { pbsNode, serverName };
        }
        // Try hostname match (PERUN FQDN vs PBS short name)
        pbsNode = serverData.nodes.items.find(
          (node) => node.name === perunHostname,
        );
        if (pbsNode) {
          return { pbsNode, serverName };
        }
        // Try matching against PBS host attribute (full hostname)
        pbsNode = serverData.nodes.items.find(
          (node) =>
            node.attributes['resources_available.host'] === nodeName ||
            node.attributes['resources_available.vnode'] === nodeName ||
            node.attributes['resources_available.host']?.split('.')[0] ===
              perunHostname,
        );
        if (pbsNode) {
          return { pbsNode, serverName };
        }
      }
    }

    return { pbsNode: null, serverName: null };
  }

  /**
   * Get node state from PBS data (future implementation)
   * For now returns null/unknown, but structure is ready for PBS integration
   */
  private getNodeStateFromPbs(nodeName: string): {
    state: NodeState | null;
    cpuUsage: number | null;
    gpuUsage: number | null;
    gpuCount: number | null;
    gpuAssigned: number | null;
    gpuCapability: string | null;
    gpuMemory: string | null;
    cudaVersion: string | null;
    memoryTotal: number | null;
    memoryUsed: number | null;
    memoryUsagePercent: number | null;
  } {
    const { pbsNode } = this.getPbsNodeData(nodeName);

    if (!pbsNode) {
      return {
        state: NodeState.UNKNOWN,
        cpuUsage: null,
        gpuUsage: null,
        gpuCount: null,
        gpuAssigned: null,
        gpuCapability: null,
        gpuMemory: null,
        cudaVersion: null,
        memoryTotal: null,
        memoryUsed: null,
        memoryUsagePercent: null,
      };
    }

    // Extract CPU/GPU usage from PBS node attributes
    const assignedCpus = parseInt(
      pbsNode.attributes['resources_assigned.ncpus'] || '0',
      10,
    );
    const availableCpus = parseInt(
      pbsNode.attributes['resources_available.ncpus'] || '0',
      10,
    );
    const assignedGpus = parseInt(
      pbsNode.attributes['resources_assigned.ngpus'] || '0',
      10,
    );
    const availableGpus = parseInt(
      pbsNode.attributes['resources_available.ngpus'] || '0',
      10,
    );

    // Extract additional GPU information
    const gpuCapability =
      pbsNode.attributes['resources_available.gpu_cap'] || null;
    const gpuMemory = pbsNode.attributes['resources_available.gpu_mem'] || null;
    const cudaVersion =
      pbsNode.attributes['resources_available.cuda_version'] || null;

    // Extract memory information
    const memoryTotalStr =
      pbsNode.attributes['resources_available.mem'] || null;
    const memoryUsedStr = pbsNode.attributes['resources_assigned.mem'] || null;

    // Parse memory values (format: "515862mb", "1536 GiB", etc.)
    const parseMemory = (memoryStr: string | null): number | null => {
      if (!memoryStr) return null;
      // Match patterns like "515862mb", "1536 GiB", "1024KB", etc.
      const memoryMatch = memoryStr.match(/^(\d+)\s*([a-z]+)$/i);
      if (memoryMatch) {
        const value = parseInt(memoryMatch[1], 10);
        const unit = memoryMatch[2].toLowerCase();
        // Convert to GB for consistency
        let gb = value;
        if (unit === 'b' || unit === 'bytes') {
          gb = value / (1024 * 1024 * 1024);
        } else if (unit === 'kb' || unit === 'k') {
          gb = value / (1024 * 1024);
        } else if (unit === 'mb' || unit === 'm') {
          gb = value / 1024;
        } else if (unit === 'gb' || unit === 'g' || unit === 'gib') {
          gb = value;
        } else if (unit === 'tb' || unit === 't' || unit === 'tib') {
          gb = value * 1024;
        }
        return Math.round(gb * 100) / 100; // Round to 2 decimal places
      }
      // Try to parse as just a number (assume bytes, convert to GB)
      const numValue = parseInt(memoryStr, 10);
      if (!isNaN(numValue)) {
        return Math.round((numValue / (1024 * 1024 * 1024)) * 100) / 100;
      }
      return null;
    };

    const memoryTotal = parseMemory(memoryTotalStr);
    const memoryUsed = parseMemory(memoryUsedStr);
    const memoryUsagePercent =
      memoryTotal && memoryTotal > 0 && memoryUsed !== null
        ? (memoryUsed / memoryTotal) * 100
        : null;

    // Calculate usage percentages
    const cpuUsage =
      availableCpus > 0 ? (assignedCpus / availableCpus) * 100 : null;
    const gpuUsage =
      availableGpus > 0 ? (assignedGpus / availableGpus) * 100 : null;

    // Determine state based on usage
    let state: NodeState = NodeState.UNKNOWN;
    if (cpuUsage !== null) {
      if (cpuUsage === 0) {
        state = NodeState.FREE;
      } else if (cpuUsage === 100) {
        state = NodeState.USED;
      } else {
        state = NodeState.PARTIALLY_USED;
      }
    }

    return {
      state,
      cpuUsage: cpuUsage !== null ? Math.round(cpuUsage * 100) / 100 : null,
      gpuUsage: gpuUsage !== null ? Math.round(gpuUsage * 100) / 100 : null,
      gpuCount: availableGpus > 0 ? availableGpus : null,
      gpuAssigned: assignedGpus > 0 ? assignedGpus : null,
      gpuCapability,
      gpuMemory,
      cudaVersion,
      memoryTotal,
      memoryUsed,
      memoryUsagePercent:
        memoryUsagePercent !== null
          ? Math.round(memoryUsagePercent * 100) / 100
          : null,
    };
  }

  /**
   * Find cluster by ID across all organizations
   */
  private findCluster(
    clusterId: string,
    organizations: PerunPhysicalMachine[],
  ): { resource: PerunResource; orgId: string } | null {
    for (const org of organizations) {
      const resources = org.resources || [];
      const resource = resources.find((r) => r.id === clusterId);
      if (resource) {
        return { resource, orgId: org.id };
      }
    }
    return null;
  }

  /**
   * Find node by name and cluster ID
   */
  private findNode(
    nodeName: string,
    clusterId: string,
    organizations: PerunPhysicalMachine[],
  ): { machine: PerunMachine; clusterId: string } | null {
    for (const org of organizations) {
      const resources = org.resources || [];
      const resource = resources.find((r) => r.id === clusterId);
      if (resource) {
        const machines = resource.machines || [];
        const machine = machines.find((m) => m.name === nodeName);
        if (machine) {
          return { machine, clusterId };
        }
      }
    }
    return null;
  }

  /**
   * Find node by name across all clusters
   */
  private findNodeByName(
    nodeName: string,
    organizations: PerunPhysicalMachine[],
  ): { machine: PerunMachine; clusterId: string } | null {
    // Extract hostname from FQDN for matching
    const nodeHostname = nodeName.split('.')[0];

    for (const org of organizations) {
      const resources = org.resources || [];
      for (const resource of resources) {
        const machines = resource.machines || [];
        // Try exact match first
        let machine = machines.find((m) => m.name === nodeName);
        if (machine) {
          return { machine, clusterId: resource.id };
        }
        // Try hostname match (FQDN vs short name)
        machine = machines.find((m) => {
          const machineHostname = m.name.split('.')[0];
          return machineHostname === nodeHostname || m.name === nodeHostname;
        });
        if (machine) {
          return { machine, clusterId: resource.id };
        }
      }
    }
    return null;
  }
}
