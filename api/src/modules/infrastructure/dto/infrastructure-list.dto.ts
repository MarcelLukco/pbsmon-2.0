import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Node state (for future PBS integration)
 */
export enum NodeState {
  FREE = 'free',
  PARTIALLY_USED = 'partially_used',
  USED = 'used',
  UNKNOWN = 'unknown',
}

/**
 * Node DTO for list view
 */
export class InfrastructureNodeListDTO {
  @Expose()
  @ApiProperty({ description: 'Node name' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'Number of CPUs' })
  cpu: number;

  @Expose()
  @ApiProperty({
    description: 'Current state of the node (from PBS)',
    enum: NodeState,
    nullable: true,
    required: false,
  })
  actualState?: NodeState | null;

  @Expose()
  @ApiProperty({
    description: 'CPU usage percentage (0-100)',
    nullable: true,
    required: false,
  })
  cpuUsagePercent?: number | null;

  @Expose()
  @ApiProperty({
    description: 'GPU usage percentage (0-100)',
    nullable: true,
    required: false,
  })
  gpuUsagePercent?: number | null;
}

/**
 * Cluster DTO for list view
 */
export class InfrastructureClusterListDTO {
  @Expose()
  @ApiProperty({ description: 'Cluster ID' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Cluster name' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'Is cluster (true/false as string)' })
  cluster: string;

  @Expose()
  @ApiProperty({ description: 'Total number of CPUs across all nodes' })
  totalCpu: number;

  @Expose()
  @ApiProperty({ description: 'Total number of nodes' })
  nodeCount: number;

  @Expose()
  @Type(() => InfrastructureNodeListDTO)
  @ApiProperty({
    description: 'List of nodes in the cluster',
    type: [InfrastructureNodeListDTO],
  })
  nodes: InfrastructureNodeListDTO[];
}

/**
 * Organization DTO for list view
 */
export class InfrastructureOrganizationListDTO {
  @Expose()
  @ApiProperty({ description: 'Organization ID' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Organization name (localized)' })
  name: {
    cs: string;
    en: string;
  };

  @Expose()
  @ApiProperty({ description: 'Number of clusters' })
  clusterCount: number;

  @Expose()
  @Type(() => InfrastructureClusterListDTO)
  @ApiProperty({
    description: 'List of clusters',
    type: [InfrastructureClusterListDTO],
  })
  clusters: InfrastructureClusterListDTO[];
}
