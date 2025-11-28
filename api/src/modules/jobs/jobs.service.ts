import { Injectable } from '@nestjs/common';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import { PbsJob, PbsData } from '@/modules/data-collection/types/pbs.types';
import { UserContext, UserRole } from '@/common/types/user-context.types';
import { JobsListDTO, JobListDTO } from './dto/job-list.dto';

@Injectable()
export class JobsService {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  /**
   * Get paginated, sorted, and filtered list of jobs
   * @param userContext User context for access control
   * @param page Page number (1-based)
   * @param limit Items per page
   * @param sort Sort column
   * @param order Sort direction (asc/desc)
   * @param search Search query (searches in job ID, name, owner, node)
   * @param state Filter by job state (Q=Queued, R=Running, C=Completed, E=Exiting, H=Held)
   */
  getJobsList(
    userContext: UserContext,
    page: number = 1,
    limit: number = 20,
    sort: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    search?: string,
    state?: string,
  ): { data: JobsListDTO; totalCount: number } {
    const pbsData = this.dataCollectionService.getPbsData();

    if (!pbsData?.servers) {
      return {
        data: { jobs: [] },
        totalCount: 0,
      };
    }

    // Collect all jobs from all servers
    const allJobs: PbsJob[] = [];
    for (const serverData of Object.values(pbsData.servers)) {
      if (serverData.jobs?.items) {
        allJobs.push(...serverData.jobs.items);
      }
    }

    // Transform to DTOs
    let jobs = allJobs.map((job) => this.transformJobToDTO(job));

    // Apply access control filter (admin sees all, non-admin sees only their jobs or group jobs)
    if (userContext.role !== UserRole.ADMIN) {
      const userGroups = this.getUserGroups(userContext);
      const username = userContext.username.split('@')[0];

      jobs = jobs.filter((job) => {
        const jobOwner = job.owner.split('@')[0];
        // User can see their own jobs
        if (jobOwner === username) {
          return true;
        }
        // User can see jobs from their groups
        if (userGroups.length > 0 && userGroups.includes(jobOwner)) {
          return true;
        }
        return false;
      });
    }

    // Apply state filter
    if (state && state.trim()) {
      jobs = jobs.filter((job) => job.state === state.trim().toUpperCase());
    }

    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      jobs = jobs.filter((job) => {
        return (
          job.id.toLowerCase().includes(searchLower) ||
          job.name.toLowerCase().includes(searchLower) ||
          job.owner.toLowerCase().includes(searchLower) ||
          (job.node && job.node.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply sorting
    jobs = this.sortJobs(jobs, sort, order);

    // Apply pagination
    const totalCount = jobs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = jobs.slice(startIndex, endIndex);

    return {
      data: { jobs: paginatedJobs },
      totalCount,
    };
  }

  /**
   * Transform PBS job to JobListDTO
   */
  private transformJobToDTO(job: PbsJob): JobListDTO {
    const attrs = job.attributes;

    // Parse resource values
    const cpuReserved = this.parseResourceValue(
      attrs['Resource_List.ncpus'] || '0',
    );
    const gpuReserved = this.parseResourceValue(
      attrs['Resource_List.ngpus'] || '0',
    );
    const memoryReserved = this.parseMemoryValue(
      attrs['Resource_List.mem'] || '0gb',
    );

    // Parse used resources (if running)
    const cpuTimeUsed = attrs['resources_used.cput'] || null;
    const gpuTimeUsed = attrs['resources_used.gput'] || null;
    const memoryUsed = attrs['resources_used.mem']
      ? this.parseMemoryValue(attrs['resources_used.mem'])
      : null;

    // Calculate usage percentages
    let cpuUsagePercent: number | null = null;
    let gpuUsagePercent: number | null = null;
    let memoryUsagePercent: number | null = null;

    if (
      attrs['job_state'] === 'R' &&
      cpuTimeUsed &&
      attrs['Resource_List.walltime']
    ) {
      // Calculate CPU usage based on walltime
      const cpuTimeSeconds = this.parseTimeToSeconds(cpuTimeUsed);
      const walltimeSeconds = this.parseTimeToSeconds(
        attrs['Resource_List.walltime'],
      );
      if (walltimeSeconds > 0) {
        cpuUsagePercent = Math.min(
          100,
          Math.round((cpuTimeSeconds / walltimeSeconds) * 100),
        );
      }
    }

    if (
      attrs['job_state'] === 'R' &&
      gpuTimeUsed &&
      attrs['Resource_List.walltime']
    ) {
      const gpuTimeSeconds = this.parseTimeToSeconds(gpuTimeUsed);
      const walltimeSeconds = this.parseTimeToSeconds(
        attrs['Resource_List.walltime'],
      );
      if (walltimeSeconds > 0) {
        gpuUsagePercent = Math.min(
          100,
          Math.round((gpuTimeSeconds / walltimeSeconds) * 100),
        );
      }
    }

    if (
      attrs['job_state'] === 'R' &&
      memoryUsed !== null &&
      memoryReserved > 0
    ) {
      memoryUsagePercent = Math.min(
        100,
        Math.round((memoryUsed / memoryReserved) * 100),
      );
    }

    // Parse exit code
    const exitCode = attrs['Exit_status']
      ? parseInt(attrs['Exit_status'], 10)
      : null;

    // Parse creation time
    const createdAt = attrs['ctime'] ? parseInt(attrs['ctime'], 10) : 0;

    // Get node name (exec_host or exec_vnode)
    let node: string | null = null;
    if (attrs['exec_host']) {
      // Format: "node1/0*8+node2/0*8" -> extract first node
      const firstNode = attrs['exec_host'].split('/')[0];
      node = firstNode || null;
    } else if (attrs['exec_vnode']) {
      // Format: "(node1:ncpus=8)" -> extract node name
      const match = attrs['exec_vnode'].match(/\(([^:]+):/);
      if (match) {
        node = match[1];
      }
    }

    const owner = attrs['Job_Owner'] || '';
    const username = owner.split('@')[0];

    return {
      id: job.name,
      name: attrs['Job_Name'] || job.name,
      state: attrs['job_state'] || 'U', // U = Unknown
      owner: owner,
      username: username,
      queue: attrs['queue'] || null,
      server: attrs['server'] || null,
      node: node,
      cpuReserved,
      gpuReserved,
      memoryReserved,
      cpuTimeUsed,
      gpuTimeUsed,
      memoryUsed,
      cpuUsagePercent,
      gpuUsagePercent,
      memoryUsagePercent,
      createdAt,
      exitCode,
    };
  }

  /**
   * Parse resource value (e.g., "8" -> 8)
   */
  private parseResourceValue(value: string): number {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Parse memory value (e.g., "8gb" -> 8, "1024mb" -> 1)
   */
  private parseMemoryValue(value: string): number {
    const lower = value.toLowerCase().trim();
    const match = lower.match(/^(\d+(?:\.\d+)?)\s*(gb|mb|kb|b)?$/);
    if (!match) return 0;

    const num = parseFloat(match[1]);
    const unit = match[2] || 'gb';

    switch (unit) {
      case 'gb':
        return num;
      case 'mb':
        return num / 1024;
      case 'kb':
        return num / (1024 * 1024);
      case 'b':
        return num / (1024 * 1024 * 1024);
      default:
        return num;
    }
  }

  /**
   * Parse time string to seconds (e.g., "100:02:54" -> 360174)
   */
  private parseTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseInt(parts[2], 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }

  /**
   * Sort jobs by column and direction
   */
  private sortJobs(
    jobs: JobListDTO[],
    sort: string,
    order: 'asc' | 'desc',
  ): JobListDTO[] {
    const sorted = [...jobs];

    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sort) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'state':
          aVal = a.state;
          bVal = b.state;
          break;
        case 'owner':
          aVal = a.owner;
          bVal = b.owner;
          break;
        case 'node':
          aVal = a.node || '';
          bVal = b.node || '';
          break;
        case 'cpuReserved':
          aVal = a.cpuReserved;
          bVal = b.cpuReserved;
          break;
        case 'gpuReserved':
          aVal = a.gpuReserved;
          bVal = b.gpuReserved;
          break;
        case 'memoryReserved':
          aVal = a.memoryReserved;
          bVal = b.memoryReserved;
          break;
        case 'createdAt':
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
      }

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Compare values
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }

  /**
   * Get user groups from Perun etc_groups data
   * Returns list of usernames that are in the same groups as the user
   */
  private getUserGroups(userContext: UserContext): string[] {
    const perunData = this.dataCollectionService.getPerunData();
    if (
      !perunData?.etcGroups ||
      !userContext.groups ||
      userContext.groups.length === 0
    ) {
      return [];
    }

    const userGroups = new Set<string>();
    const username = userContext.username.split('@')[0];

    // Find all groups the user belongs to across all servers
    for (const serverGroups of perunData.etcGroups) {
      for (const group of serverGroups.entries) {
        // Check if user is a member of this group
        if (group.members.includes(username)) {
          // Add all members of this group (except the user themselves)
          for (const member of group.members) {
            if (member !== username) {
              userGroups.add(member);
            }
          }
        }
      }
    }

    return Array.from(userGroups);
  }
}
