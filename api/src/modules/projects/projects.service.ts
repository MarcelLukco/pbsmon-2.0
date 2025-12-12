import { Injectable, Logger } from '@nestjs/common';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import { PrometheusResponse } from '@/modules/data-collection/clients/prometheus.client';
import { UserContext, UserRole } from '@/common/types/user-context.types';
import {
  ProjectDTO,
  ProjectsListDTO,
  ProjectDetailDTO,
  ProjectReservedResourcesDTO,
  ProjectVmDTO,
} from './dto/project.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  // e-infra domain id
  private readonly DOMAIN_ID = '3b5cb406d60249508d0ddab2a80502b5';

  constructor(private readonly dataCollectionService: DataCollectionService) {}

  /**
   * Get all projects accessible to the user with pagination, search, and sorting
   * Admin sees all projects, regular users see only their projects
   */
  async getProjects(
    userContext: UserContext,
    page: number = 1,
    limit: number = 20,
    sort: string = 'name',
    order: 'asc' | 'desc' = 'asc',
    search?: string,
  ): Promise<{ data: ProjectsListDTO; totalCount: number }> {
    // Get all OpenStack projects from Prometheus
    let allProjects = await this.getAllProjects();

    // Get user's project names (for both admin and non-admin)
    const userProjectNames = await this.getUserProjectIds(userContext.id);
    const userOidcSub = `${userContext.id}@einfra.cesnet.cz`;

    // Mark personal projects for non-admin users
    if (userContext.role !== UserRole.ADMIN) {
      const personalProject = allProjects.find(
        (p) =>
          (p.name === userContext.username ||
            p.description?.includes(userContext.username) ||
            p.id === userContext.username) &&
          userProjectNames.has(p.name),
      );
      if (personalProject) {
        personalProject.isPersonal = true;
      }
    }

    // Mark "my project" for admins
    if (userContext.role === UserRole.ADMIN) {
      for (const project of allProjects) {
        // Mark as "my project" if:
        // 1. Project name is in user's project names list
        // 2. OR project name matches user's OIDC sub format
        if (
          userProjectNames.has(project.name) ||
          project.name === userOidcSub
        ) {
          project.isMyProject = true;
        }
      }
    }

    // If not admin, filter to only user's projects
    if (userContext.role !== UserRole.ADMIN) {
      allProjects = allProjects.filter((p) => userProjectNames.has(p.name));
    }

    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      allProjects = allProjects.filter((project) => {
        const nameMatch = project.name.toLowerCase().includes(searchLower);
        const descriptionMatch = project.description
          ? project.description.toLowerCase().includes(searchLower)
          : false;
        const idMatch = project.id.toLowerCase().includes(searchLower);
        return nameMatch || descriptionMatch || idMatch;
      });
    }

    // Apply sorting
    allProjects = this.sortProjects(allProjects, sort, order);

    // Apply pagination
    const totalCount = allProjects.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = allProjects.slice(startIndex, endIndex);

    return {
      data: { projects: paginatedProjects },
      totalCount,
    };
  }

  /**
   * Get all OpenStack projects from cached data
   */
  private async getAllProjects(): Promise<ProjectDTO[]> {
    try {
      const prometheusData = this.dataCollectionService.getPrometheusData();

      // Get OpenStack projects from cached data (always available)
      if (!prometheusData || !('OpenStack Projects' in prometheusData)) {
        this.logger.error('OpenStack Projects data not found in cache');
        return [];
      }

      const projectsResponse = prometheusData[
        'OpenStack Projects'
      ] as PrometheusResponse;
      return await this.parseProjectsFromResponse(projectsResponse);
    } catch (error) {
      this.logger.error(
        `Failed to get all projects: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Get user project names by OIDC sub
   * Uses cached aai_dump_user_info data collected from Prometheus
   * Returns set of project names the user has access to
   */
  async getUserProjectIds(oidcSub: string): Promise<Set<string>> {
    try {
      const prometheusData = this.dataCollectionService.getPrometheusData();

      // Get OpenStack Users from cached data (always available)
      if (!prometheusData || !('OpenStack Users' in prometheusData)) {
        this.logger.error('OpenStack Users data not found in cache');
        return new Set<string>();
      }

      const usersResponse = prometheusData[
        'OpenStack Users'
      ] as PrometheusResponse;
      const projectNames = new Set<string>();
      let hasIndividualsAccess = false;

      const allProjects = await this.getAllProjects();
      const validProjectNames = new Set(allProjects.map((p) => p.name));

      if (usersResponse?.data?.result) {
        for (const item of usersResponse.data.result) {
          const userId = item.metric?.id;
          const userOidcSub = userId.replace('@einfra.cesnet.cz', '');
          if (userId !== oidcSub && userOidcSub !== oidcSub) {
            continue;
          }

          const projectName = item.metric?.ostack_project;
          if (projectName) {
            if (projectName === 'individuals') {
              hasIndividualsAccess = true;
            } else {
              if (validProjectNames.has(projectName)) {
                projectNames.add(projectName);
              }
            }
          }
        }
      }

      // If user has "individuals" access, find their personal project
      if (hasIndividualsAccess) {
        const personalProject = allProjects.find(
          (p) =>
            p.name === `${oidcSub}@einfra.cesnet.cz` ||
            p.description?.includes(oidcSub) ||
            p.id === oidcSub,
        );
        if (personalProject) {
          projectNames.add(personalProject.name);
        }
      }

      return projectNames;
    } catch (error) {
      this.logger.error(
        `Failed to get user projects for ${oidcSub}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return new Set<string>();
    }
  }

  /**
   * Parse Prometheus response to ProjectDTO array
   * Gets only projects from e-infra domain
   */
  private async parseProjectsFromResponse(
    response: PrometheusResponse,
  ): Promise<ProjectDTO[]> {
    const projects: ProjectDTO[] = [];
    const reservedResourcesMap = await this.calculateReservedResources();

    if (response.data?.result) {
      for (const item of response.data.result) {
        const projectId = item.metric?.id || item.metric?.project_id;
        const projectName = item.metric?.name;
        const domainId = item.metric?.domain_id;

        if (domainId !== this.DOMAIN_ID) {
          continue;
        }

        if (projectId && projectName) {
          const enabled = item.metric?.enabled === 'true';
          const timestamp = item.value?.[0];
          const createdAt = timestamp
            ? new Date(Number(timestamp) * 1000).toISOString()
            : null;

          const reservedResources =
            reservedResourcesMap.get(projectId) ||
            ({
              vmCount: 0,
              vcpus: 0,
              memoryGb: 0,
            } as ProjectReservedResourcesDTO);

          projects.push({
            id: projectId,
            name: projectName,
            description: item.metric?.description || null,
            status: enabled ? 'active' : 'expired',
            reservedResources,
            isPersonal: false,
            isMyProject: false,
          });
        }
      }
    }

    return projects;
  }

  /**
   * Calculate reserved resources per project from cached OpenStack servers data
   */
  private async calculateReservedResources(): Promise<
    Map<string, ProjectReservedResourcesDTO>
  > {
    const resourcesMap = new Map<string, ProjectReservedResourcesDTO>();

    try {
      const prometheusData = this.dataCollectionService.getPrometheusData();

      // Get OpenStack servers from cached data (always available)
      if (!prometheusData || !('OpenStack Servers' in prometheusData)) {
        this.logger.error('OpenStack Servers data not found in cache');
        return resourcesMap;
      }

      const serversResponse = prometheusData[
        'OpenStack Servers'
      ] as PrometheusResponse;

      if (serversResponse?.data?.result) {
        for (const item of serversResponse.data.result) {
          const projectId = item.metric?.project_id;
          if (!projectId) continue;

          const flavorName = item.metric?.flavor_name || '';
          // Parse flavor name to extract resources (e.g., "a3.16core-120ram-nvidia-l40s")
          const vcpus = this.parseVcpusFromFlavor(flavorName);
          const memoryGb = this.parseMemoryFromFlavor(flavorName);

          const existing = resourcesMap.get(projectId);
          if (existing) {
            existing.vmCount += 1;
            existing.vcpus += vcpus;
            existing.memoryGb += memoryGb;
          } else {
            resourcesMap.set(projectId, {
              vmCount: 1,
              vcpus,
              memoryGb,
            });
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to calculate reserved resources: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return resourcesMap;
  }

  /**
   * Parse vCPUs from flavor name (e.g., "a3.16core-120ram" -> 16)
   */
  private parseVcpusFromFlavor(flavorName: string): number {
    const match = flavorName.match(/(\d+)core/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Parse memory from flavor name (e.g., "a3.16core-120ram" -> 120)
   */
  private parseMemoryFromFlavor(flavorName: string): number {
    const match = flavorName.match(/(\d+)ram/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Sort projects by column and direction
   */
  private sortProjects(
    projects: ProjectDTO[],
    sort: string,
    order: 'asc' | 'desc',
  ): ProjectDTO[] {
    const sorted = [...projects];

    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'vmCount':
          aValue = a.reservedResources.vmCount;
          bValue = b.reservedResources.vmCount;
          break;
        case 'vcpus':
          aValue = a.reservedResources.vcpus;
          bValue = b.reservedResources.vcpus;
          break;
        case 'memoryGb':
          aValue = a.reservedResources.memoryGb;
          bValue = b.reservedResources.memoryGb;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Get project detail by ID
   * Admin can see any project, regular users can only see projects they are members of
   */
  async getProjectDetail(
    projectId: string,
    userContext: UserContext,
  ): Promise<ProjectDetailDTO> {
    // Get all projects
    const allProjects = await this.getAllProjects();
    const project = allProjects.find((p) => p.id === projectId);

    if (!project) {
      throw new Error(`Project '${projectId}' not found`);
    }

    // Get user's project names
    const userProjectNames = await this.getUserProjectIds(userContext.id);
    const userOidcSub = `${userContext.id}@einfra.cesnet.cz`;

    // Check access: admin can see all, regular users can only see their projects
    if (userContext.role !== UserRole.ADMIN) {
      if (!userProjectNames.has(project.name)) {
        throw new Error(`Project '${projectId}' not found`);
      }
    }

    // Mark as "my project" for admins
    if (userContext.role === UserRole.ADMIN) {
      if (userProjectNames.has(project.name) || project.name === userOidcSub) {
        project.isMyProject = true;
      }
    }

    // Mark as personal for non-admin users
    if (userContext.role !== UserRole.ADMIN) {
      if (
        project.name === userContext.username ||
        project.description?.includes(userContext.username) ||
        project.id === userContext.username
      ) {
        project.isPersonal = true;
      }
    }

    // Get VMs for this project
    const vms = await this.getProjectVms(projectId);

    return {
      ...project,
      vms,
    };
  }

  /**
   * Get VMs/servers for a specific project from cached data
   */
  private async getProjectVms(projectId: string): Promise<ProjectVmDTO[]> {
    const vms: ProjectVmDTO[] = [];

    try {
      const prometheusData = this.dataCollectionService.getPrometheusData();

      // Get OpenStack servers from cached data (always available)
      if (!prometheusData || !('OpenStack Servers' in prometheusData)) {
        this.logger.error('OpenStack Servers data not found in cache');
        return vms;
      }

      const serversResponse = prometheusData[
        'OpenStack Servers'
      ] as PrometheusResponse;

      // Filter servers by project_id from cached data
      if (serversResponse?.data?.result) {
        for (const item of serversResponse.data.result) {
          const serverProjectId = item.metric?.project_id;
          if (serverProjectId !== projectId) continue;

          const serverId = item.metric?.server_id;
          const serverName = item.metric?.server_name;
          const flavorName = item.metric?.flavor_name || '';

          if (serverId && serverName) {
            const vcpus = this.parseVcpusFromFlavor(flavorName);
            const memoryGb = this.parseMemoryFromFlavor(flavorName);

            vms.push({
              id: serverId,
              name: serverName,
              flavorName,
              vcpus,
              memoryGb,
            });
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to get VMs for project ${projectId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return vms;
  }
}
