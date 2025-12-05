import { Injectable, NotFoundException } from '@nestjs/common';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import { PbsJob, PbsData } from '@/modules/data-collection/types/pbs.types';
import { UserContext, UserRole } from '@/common/types/user-context.types';
import { JobsListDTO, JobListDTO } from './dto/job-list.dto';
import {
  JobDetailDTO,
  SubjobDTO,
  AllocatedResourceDTO,
  JobMessageDTO,
} from './dto/job-detail.dto';
import { getJobStateFromPbsState } from './helpers/job-state.helper';

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
   * @param node Filter by node/machine name
   * @param queue Filter by queue name
   */
  getJobsList(
    userContext: UserContext,
    page: number = 1,
    limit: number = 20,
    sort: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    search?: string,
    state?: string,
    node?: string,
    queue?: string,
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

    // Apply node filter
    if (node && node.trim()) {
      jobs = jobs.filter((job) => {
        if (!job.node) return false;
        // Match exact node name or node name with cluster suffix
        return (
          job.node.toLowerCase() === node.trim().toLowerCase() ||
          job.node.toLowerCase().startsWith(node.trim().toLowerCase() + '.')
        );
      });
    }

    // Apply state filter
    if (state && state.trim()) {
      jobs = jobs.filter((job) => job.state === state.trim().toUpperCase());
    }

    // Apply queue filter
    if (queue && queue.trim()) {
      jobs = jobs.filter((job) => {
        if (!job.queue) return false;
        // Match exact queue name or queue name with server suffix
        const queueName = queue.trim();
        return (
          job.queue.toLowerCase() === queueName.toLowerCase() ||
          job.queue.toLowerCase().startsWith(queueName.toLowerCase() + '@')
        );
      });
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

    // Parse used resources (for running, exiting, and completed jobs: C, F, X)
    const state = attrs['job_state'] || 'U';
    const completedStates = ['C', 'F', 'X'];
    const hasResourceUsage =
      state === 'R' || state === 'E' || completedStates.includes(state);

    const cpuTimeUsed = hasResourceUsage
      ? attrs['resources_used.cput'] || null
      : null;
    const gpuTimeUsed = hasResourceUsage
      ? attrs['resources_used.gput'] || null
      : null;
    const memoryUsed = hasResourceUsage
      ? attrs['resources_used.mem']
        ? this.parseMemoryValue(attrs['resources_used.mem'])
        : null
      : null;

    // Calculate usage percentages
    let cpuUsagePercent: number | null = null;
    let gpuUsagePercent: number | null = null;
    let memoryUsagePercent: number | null = null;

    // Calculate CPU efficiency: CPU time used vs maximum possible (walltime * numCPUs)
    if (
      hasResourceUsage &&
      cpuTimeUsed &&
      attrs['Resource_List.walltime'] &&
      cpuReserved > 0
    ) {
      const cpuTimeSeconds = this.parseTimeToSeconds(cpuTimeUsed);
      const walltimeSeconds = this.parseTimeToSeconds(
        attrs['Resource_List.walltime'],
      );
      const maxCpuTimeSeconds = walltimeSeconds * cpuReserved;
      if (maxCpuTimeSeconds > 0) {
        cpuUsagePercent = Math.min(
          100,
          Math.round((cpuTimeSeconds / maxCpuTimeSeconds) * 100),
        );
      }
    }

    if (
      hasResourceUsage &&
      gpuTimeUsed &&
      attrs['Resource_List.walltime'] &&
      gpuReserved > 0
    ) {
      const gpuTimeSeconds = this.parseTimeToSeconds(gpuTimeUsed);
      const walltimeSeconds = this.parseTimeToSeconds(
        attrs['Resource_List.walltime'],
      );
      const maxGpuTimeSeconds = walltimeSeconds * gpuReserved;
      if (maxGpuTimeSeconds > 0) {
        gpuUsagePercent = Math.min(
          100,
          Math.round((gpuTimeSeconds / maxGpuTimeSeconds) * 100),
        );
      }
    }

    if (hasResourceUsage && memoryUsed !== null && memoryReserved > 0) {
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
    // Use the already declared state variable from line 156
    const stateInfo = getJobStateFromPbsState(state, exitCode);

    return {
      id: job.name,
      name: attrs['Job_Name'] || job.name,
      state: state,
      stateName: stateInfo.name,
      stateColor: stateInfo.color,
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

  /**
   * Get detailed information about a specific job
   * @param userContext User context for access control
   * @param jobId Job ID (e.g., "11118906.pbs-m1.metacentrum.cz" or "14699148[96].pbs-m1.metacentrum.cz")
   */
  getJobDetail(userContext: UserContext, jobId: string): JobDetailDTO {
    const pbsData = this.dataCollectionService.getPbsData();

    if (!pbsData?.servers) {
      throw new NotFoundException('Job not found');
    }

    // Find the job across all servers
    let job: PbsJob | null = null;
    for (const serverData of Object.values(pbsData.servers)) {
      if (serverData.jobs?.items) {
        const found = serverData.jobs.items.find((j) => j.name === jobId);
        if (found) {
          job = found;
          break;
        }
      }
    }

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check access control
    const attrs = job.attributes;
    const owner = attrs['Job_Owner'] || '';
    const jobOwner = owner.split('@')[0];

    if (userContext.role !== UserRole.ADMIN) {
      const userGroups = this.getUserGroups(userContext);
      const username = userContext.username.split('@')[0];

      const hasAccess =
        jobOwner === username ||
        (userGroups.length > 0 && userGroups.includes(jobOwner));

      if (!hasAccess) {
        throw new NotFoundException('Job not found');
      }
    }

    // Transform to detail DTO
    return this.transformJobToDetailDTO(job, pbsData);
  }

  /**
   * Transform PBS job to JobDetailDTO
   */
  private transformJobToDetailDTO(job: PbsJob, pbsData: PbsData): JobDetailDTO {
    const attrs = job.attributes;

    // Basic info
    const owner = attrs['Job_Owner'] || '';
    const username = owner.split('@')[0];
    const state = attrs['job_state'] || 'U';

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
    const walltimeReserved = attrs['Resource_List.walltime']
      ? this.parseTimeToSeconds(attrs['Resource_List.walltime'])
      : null;
    const scratchReserved = attrs['Resource_List.scratch_local']
      ? this.parseMemoryValue(attrs['Resource_List.scratch_local'])
      : attrs['Resource_List.scratch_ssd']
        ? this.parseMemoryValue(attrs['Resource_List.scratch_ssd'])
        : attrs['Resource_List.scratch_volume']
          ? this.parseMemoryValue(attrs['Resource_List.scratch_volume'])
          : null;

    // Build requested resources string
    const requestedResourcesParts: string[] = [];
    if (cpuReserved > 0) {
      requestedResourcesParts.push(`ncpus=${cpuReserved}`);
    }
    if (memoryReserved > 0) {
      requestedResourcesParts.push(`mem=${memoryReserved}gb`);
    }
    if (scratchReserved && scratchReserved > 0) {
      const scratchType = attrs['Resource_List.scratch_local']
        ? 'scratch_local'
        : attrs['Resource_List.scratch_ssd']
          ? 'scratch_ssd'
          : 'scratch_volume';
      requestedResourcesParts.push(`${scratchType}=${scratchReserved}gb`);
    }
    if (attrs['Resource_List.mpiprocs']) {
      requestedResourcesParts.push(
        `mpiprocs=${attrs['Resource_List.mpiprocs']}`,
      );
    }
    if (attrs['Resource_List.ompthreads']) {
      requestedResourcesParts.push(
        `ompthreads=${attrs['Resource_List.ompthreads']}`,
      );
    }
    const requestedResources =
      requestedResourcesParts.length > 0
        ? `1:${requestedResourcesParts.join(':')}`
        : '';

    // Parse used resources (for running, exiting, and completed jobs: C, F, X)
    const completedStates = ['C', 'F', 'X'];
    const hasResourceUsage =
      state === 'R' || state === 'E' || completedStates.includes(state);

    const cpuTimeUsed = hasResourceUsage
      ? attrs['resources_used.cput'] || null
      : null;
    const gpuTimeUsed = hasResourceUsage
      ? attrs['resources_used.gput'] || null
      : null;
    const memoryUsed = hasResourceUsage
      ? attrs['resources_used.mem']
        ? this.parseMemoryValue(attrs['resources_used.mem'])
        : null
      : null;

    // Calculate runtime
    let runtime: string | null = null;
    if (hasResourceUsage) {
      const startTime = attrs['stime'] ? parseInt(attrs['stime'], 10) : null;
      const endTime = attrs['etime'] ? parseInt(attrs['etime'], 10) : null;
      const currentTime = Math.floor(Date.now() / 1000);
      const end = endTime || (state === 'R' ? currentTime : null);
      if (startTime && end) {
        const runtimeSeconds = end - startTime;
        runtime = this.formatTimeFromSeconds(runtimeSeconds);
      }
    }

    // Calculate usage percentages
    let cpuUsagePercent: number | null = null;
    let gpuUsagePercent: number | null = null;
    let memoryUsagePercent: number | null = null;

    // Calculate CPU efficiency: CPU time used vs maximum possible (walltime * numCPUs)
    if (
      hasResourceUsage &&
      cpuTimeUsed &&
      walltimeReserved &&
      cpuReserved > 0
    ) {
      const cpuTimeSeconds = this.parseTimeToSeconds(cpuTimeUsed);
      const maxCpuTimeSeconds = walltimeReserved * cpuReserved;
      if (maxCpuTimeSeconds > 0) {
        cpuUsagePercent = Math.min(
          100,
          Math.round((cpuTimeSeconds / maxCpuTimeSeconds) * 100),
        );
      }
    }

    if (
      hasResourceUsage &&
      gpuTimeUsed &&
      walltimeReserved &&
      gpuReserved > 0
    ) {
      const gpuTimeSeconds = this.parseTimeToSeconds(gpuTimeUsed);
      const maxGpuTimeSeconds = walltimeReserved * gpuReserved;
      if (maxGpuTimeSeconds > 0) {
        gpuUsagePercent = Math.min(
          100,
          Math.round((gpuTimeSeconds / maxGpuTimeSeconds) * 100),
        );
      }
    }

    if (hasResourceUsage && memoryUsed !== null && memoryReserved > 0) {
      memoryUsagePercent = Math.min(
        100,
        Math.round((memoryUsed / memoryReserved) * 100),
      );
    }

    // Parse timestamps
    const createdAt = attrs['ctime'] ? parseInt(attrs['ctime'], 10) : 0;
    // qtime is the eligible time (when job became eligible to run)
    // etime might be end time in some PBS versions, so prefer qtime
    const eligibleAt = attrs['qtime']
      ? parseInt(attrs['qtime'], 10)
      : attrs['etime']
        ? parseInt(attrs['etime'], 10)
        : null;
    const startedAt = attrs['stime'] ? parseInt(attrs['stime'], 10) : null;
    const lastStateChangeAt = attrs['mtime']
      ? parseInt(attrs['mtime'], 10)
      : null;
    const kerberosTicketAt = attrs['krtime']
      ? parseInt(attrs['krtime'], 10)
      : null;

    // Get node name
    let node: string | null = null;
    if (attrs['exec_host']) {
      const firstNode = attrs['exec_host'].split('/')[0];
      node = firstNode || null;
    } else if (attrs['exec_vnode']) {
      const match = attrs['exec_vnode'].match(/\(([^:]+):/);
      if (match) {
        node = match[1];
      }
    }

    // Parse allocated resources per machine
    const allocatedResources: AllocatedResourceDTO[] = [];
    if (attrs['exec_vnode']) {
      // Parse exec_vnode format: "(node1:ncpus=4:mem=2097152kb:scratch_local=1048576kb)"
      const vnodeMatches = attrs['exec_vnode'].matchAll(/\(([^:]+):([^)]+)\)/g);
      for (const match of vnodeMatches) {
        const machine = match[1];
        const resources = match[2];
        let cpu = 0;
        let gpu = 0;
        let ram = 0;
        let scratch: number | null = null;
        let scratchType: string | null = null;

        // Parse resources
        const resourceParts = resources.split(':');
        for (const part of resourceParts) {
          if (part.startsWith('ncpus=')) {
            cpu = this.parseResourceValue(part.split('=')[1]);
          } else if (part.startsWith('ngpus=')) {
            gpu = this.parseResourceValue(part.split('=')[1]);
          } else if (part.startsWith('mem=')) {
            ram = this.parseMemoryValue(part.split('=')[1]);
          } else if (part.startsWith('scratch_local=')) {
            scratch = this.parseMemoryValue(part.split('=')[1]);
            scratchType = 'local';
          } else if (part.startsWith('scratch_ssd=')) {
            scratch = this.parseMemoryValue(part.split('=')[1]);
            scratchType = 'ssd';
          } else if (part.startsWith('scratch_volume=')) {
            scratch = this.parseMemoryValue(part.split('=')[1]);
            scratchType = 'volume';
          }
        }

        if (machine) {
          allocatedResources.push({
            machine,
            cpu,
            gpu,
            ram,
            scratch,
            scratchType,
          });
        }
      }
    }

    // Extract environment variables (all PBS_* and TORQUE_* variables)
    const environmentVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (
        key.startsWith('PBS_') ||
        key.startsWith('TORQUE_') ||
        key.startsWith('SCRATCH') ||
        key.startsWith('SINGULARITY_')
      ) {
        environmentVariables[key] = value;
      }
    }

    // Find subjobs (array jobs)
    const subjobs: SubjobDTO[] | null = this.findSubjobs(job, pbsData);

    // Generate custom messages
    const messages: JobMessageDTO[] = this.generateMessages(
      state,
      cpuUsagePercent,
      gpuUsagePercent,
      memoryUsagePercent,
      cpuReserved,
      gpuReserved,
      memoryReserved,
      memoryUsed,
    );

    // Parse exit code
    const exitCode = attrs['Exit_status']
      ? parseInt(attrs['Exit_status'], 10)
      : null;

    // Get state info
    const stateInfo = getJobStateFromPbsState(state, exitCode);

    return {
      id: job.name,
      name: attrs['Job_Name'] || job.name,
      state,
      stateName: stateInfo.name,
      stateColor: stateInfo.color,
      owner,
      username,
      queue: attrs['queue'] || null,
      server: attrs['server'] || null,
      node,
      requestedResources,
      cpuReserved,
      gpuReserved,
      memoryReserved,
      walltimeReserved,
      scratchReserved,
      cpuTimeUsed,
      gpuTimeUsed,
      memoryUsed,
      runtime,
      cpuUsagePercent,
      gpuUsagePercent,
      memoryUsagePercent,
      createdAt,
      eligibleAt,
      startedAt,
      lastStateChangeAt,
      kerberosTicketAt,
      stdoutDirectory: attrs['Output_Path']?.split(':')[0] || null,
      workingDirectory: attrs['PBS_O_WORKDIR'] || null,
      scratchDirectory: attrs['SCRATCHDIR'] || null,
      comment: attrs['comment'] || null,
      exitCode,
      allocatedResources,
      environmentVariables,
      subjobs,
      messages,
      rawAttributes: attrs, // Include all raw PBS attributes
    };
  }

  /**
   * Find subjobs for array jobs
   */
  private findSubjobs(job: PbsJob, pbsData: PbsData): SubjobDTO[] | null {
    const attrs = job.attributes;
    const jobId = job.name;

    // Check if this is an array job (format: "14699148[].pbs-m1.metacentrum.cz")
    const arrayMatch = jobId.match(/^(\d+)\[\]/);
    if (!arrayMatch) {
      return null;
    }

    const baseJobId = arrayMatch[1];
    const subjobs: SubjobDTO[] = [];

    // Find all subjobs across all servers
    for (const serverData of Object.values(pbsData.servers)) {
      if (serverData.jobs?.items) {
        for (const subjob of serverData.jobs.items) {
          // Match subjob format: "14699148[96].pbs-m1.metacentrum.cz"
          const subjobMatch = subjob.name.match(
            new RegExp(`^${baseJobId}\\[(\\d+)\\]`),
          );
          if (subjobMatch) {
            const subAttrs = subjob.attributes;
            const subState = subAttrs['job_state'] || 'U';

            // Parse resources
            const cpuReserved = this.parseResourceValue(
              subAttrs['Resource_List.ncpus'] || '0',
            );
            const gpuReserved = this.parseResourceValue(
              subAttrs['Resource_List.ngpus'] || '0',
            );
            const memoryReserved = this.parseMemoryValue(
              subAttrs['Resource_List.mem'] || '0gb',
            );

            // Parse used resources (for running, exiting, and completed jobs: C, F, X)
            const subCompletedStates = ['C', 'F', 'X'];
            const subHasResourceUsage =
              subState === 'R' ||
              subState === 'E' ||
              subCompletedStates.includes(subState);

            const memoryUsed = subHasResourceUsage
              ? subAttrs['resources_used.mem']
                ? this.parseMemoryValue(subAttrs['resources_used.mem'])
                : null
              : null;
            const cpuTimeUsed = subHasResourceUsage
              ? subAttrs['resources_used.cput'] || null
              : null;

            // Calculate runtime
            let runtime: string | null = null;
            if (subHasResourceUsage) {
              const startTime = subAttrs['stime']
                ? parseInt(subAttrs['stime'], 10)
                : null;
              const endTime = subAttrs['etime']
                ? parseInt(subAttrs['etime'], 10)
                : null;
              const currentTime = Math.floor(Date.now() / 1000);
              const end = endTime || (subState === 'R' ? currentTime : null);
              if (startTime && end) {
                const runtimeSeconds = end - startTime;
                runtime = this.formatTimeFromSeconds(runtimeSeconds);
              }
            }

            // Get node
            let node: string | null = null;
            if (subAttrs['exec_host']) {
              const firstNode = subAttrs['exec_host'].split('/')[0];
              node = firstNode || null;
            } else if (subAttrs['exec_vnode']) {
              const match = subAttrs['exec_vnode'].match(/\(([^:]+):/);
              if (match) {
                node = match[1];
              }
            }

            const exitCode = subAttrs['Exit_status']
              ? parseInt(subAttrs['Exit_status'], 10)
              : null;

            const subStateInfo = getJobStateFromPbsState(subState, exitCode);

            subjobs.push({
              id: subjob.name,
              state: subState,
              stateName: subStateInfo.name,
              stateColor: subStateInfo.color,
              node,
              cpuReserved,
              gpuReserved,
              memoryReserved,
              memoryUsed,
              cpuTimeUsed,
              runtime,
              exitCode,
            });
          }
        }
      }
    }

    return subjobs.length > 0 ? subjobs : null;
  }

  /**
   * Generate custom messages based on resource usage
   */
  private generateMessages(
    state: string,
    cpuUsagePercent: number | null,
    gpuUsagePercent: number | null,
    memoryUsagePercent: number | null,
    cpuReserved: number,
    gpuReserved: number,
    memoryReserved: number,
    memoryUsed: number | null,
  ): JobMessageDTO[] {
    const messages: JobMessageDTO[] = [];

    // Only generate messages for running or finished jobs
    const completedStates = ['C', 'F', 'X'];
    const hasResourceUsage =
      state === 'R' || state === 'E' || completedStates.includes(state);

    if (!hasResourceUsage) {
      return messages;
    }

    // Check CPU efficiency (CPU time usage vs maximum possible)
    if (cpuUsagePercent !== null && cpuUsagePercent < 75 && cpuReserved > 0) {
      messages.push({
        type: 'warning',
        message: `CPU usage is below 75% (${cpuUsagePercent}%). The job was inefficient. Consider reducing the number of CPUs requested.`,
        code: 'cpuUsageLow',
        params: { percent: cpuUsagePercent },
      });
    }

    // Check GPU usage
    if (gpuUsagePercent !== null && gpuUsagePercent < 75 && gpuReserved > 0) {
      messages.push({
        type: 'warning',
        message: `GPU usage is below 75% (${gpuUsagePercent}%). Consider reducing the number of GPUs requested.`,
        code: 'gpuUsageLow',
        params: { percent: gpuUsagePercent },
      });
    }

    // Check memory usage
    if (
      memoryUsagePercent !== null &&
      memoryUsagePercent < 75 &&
      memoryReserved > 0
    ) {
      messages.push({
        type: 'warning',
        message: `Memory usage is below 75% (${memoryUsagePercent}%). Consider reducing the amount of memory requested.`,
        code: 'memoryUsageLow',
        params: { percent: memoryUsagePercent },
      });
    }

    // Check if memory is over-allocated
    if (
      memoryUsed !== null &&
      memoryReserved > 0 &&
      memoryUsed > memoryReserved * 1.1
    ) {
      messages.push({
        type: 'error',
        message: `Memory usage (${memoryUsed.toFixed(2)} GB) exceeds reserved memory (${memoryReserved.toFixed(2)} GB).`,
        code: 'memoryOverAllocated',
        params: {
          memoryUsed: memoryUsed.toFixed(2),
          memoryReserved: memoryReserved.toFixed(2),
        },
      });
    }

    return messages;
  }

  /**
   * Format seconds to HH:MM:SS
   */
  private formatTimeFromSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
