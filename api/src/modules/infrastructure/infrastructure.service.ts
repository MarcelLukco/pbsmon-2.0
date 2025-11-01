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
import { PbsNode } from '@/modules/data-collection/types/pbs.types';

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
    const pbsNodesMap = new Map<string, PbsNode>();
    if (pbsData?.nodes?.items) {
      pbsData.nodes.items.forEach((node) => {
        pbsNodesMap.set(node.name, node);
      });
    }

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
          const pbsNode = pbsNodesMap.get(node.name);
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
      totalGpu: totalGpu > 0 ? totalGpu : null,
      totalMemory: totalMemory > 0 ? totalMemory : null,
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
      totalGpu: null,
      totalMemory: null,
      freeNodes: 0,
      partiallyUsedNodes: 0,
      usedNodes: 0,
      unknownNodes: 0,
    };
  }

  /**
   * Get infrastructure detail by ID
   * ID format: organization-{id}, cluster-{id}, node-{clusterId}-{nodeName}
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

    if (id.startsWith('cluster-')) {
      const clusterId = id.replace('cluster-', '');
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

    if (id.startsWith('node-')) {
      const parts = id.replace('node-', '').split('-');
      if (parts.length < 2) {
        throw new NotFoundException(`Invalid node ID format: '${id}'`);
      }
      const clusterId = parts[0];
      const nodeName = parts.slice(1).join('-');
      const node = this.findNode(
        nodeName,
        clusterId,
        perunData.machines.physical_machines,
      );
      if (!node) {
        throw new NotFoundException(
          `Node '${nodeName}' in cluster '${clusterId}' was not found`,
        );
      }
      return this.mapNodeToDetail(node);
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

    return {
      name: machine.name,
      cpu: machine.cpu,
      actualState: pbsState.state,
      cpuUsagePercent: pbsState.cpuUsage,
      gpuUsagePercent: pbsState.gpuUsage,
    };
  }

  /**
   * Get node state from PBS data (future implementation)
   * For now returns null/unknown, but structure is ready for PBS integration
   */
  private getNodeStateFromPbs(nodeName: string): {
    state: NodeState | null;
    cpuUsage: number | null;
    gpuUsage: number | null;
  } {
    const pbsData = this.dataCollectionService.getPbsData();

    if (!pbsData?.nodes?.items) {
      return {
        state: null,
        cpuUsage: null,
        gpuUsage: null,
      };
    }

    // Find node in PBS data
    const pbsNode = pbsData.nodes.items.find((node) => node.name === nodeName);

    if (!pbsNode) {
      return {
        state: NodeState.UNKNOWN,
        cpuUsage: null,
        gpuUsage: null,
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
}
