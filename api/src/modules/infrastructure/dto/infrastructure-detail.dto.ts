import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { NodeState } from './infrastructure-list.dto';

/**
 * Localized string DTO
 */
export class LocalizedStringDTO {
  @Expose()
  @ApiProperty({ description: 'Czech translation' })
  cs: string;

  @Expose()
  @ApiProperty({ description: 'English translation' })
  en: string;
}

/**
 * Node DTO for detail view (full Perun data + PBS state)
 */
export class InfrastructureNodeDetailDTO {
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
 * Cluster DTO for detail view (full Perun data + aggregated PBS state)
 */
export class InfrastructureClusterDetailDTO {
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
  @Type(() => LocalizedStringDTO)
  @ApiProperty({ description: 'Description (localized)' })
  desc: LocalizedStringDTO;

  @Expose()
  @Type(() => LocalizedStringDTO)
  @ApiProperty({ description: 'Specification (localized)' })
  spec: LocalizedStringDTO;

  @Expose()
  @ApiProperty({ description: 'CPU description', nullable: true })
  cpudesc: string | null;

  @Expose()
  @ApiProperty({ description: 'GPU description', nullable: true })
  gpudesc: string | null;

  @Expose()
  @ApiProperty({ description: 'Photo URL', nullable: true })
  photo: string | null;

  @Expose()
  @ApiProperty({ description: 'Thumbnail URL', nullable: true })
  thumbnail: string | null;

  @Expose()
  @ApiProperty({ description: 'Memory specification' })
  memory: string;

  @Expose()
  @Type(() => LocalizedStringDTO)
  @ApiProperty({ description: 'Disk specification (localized)' })
  disk: LocalizedStringDTO;

  @Expose()
  @Type(() => LocalizedStringDTO)
  @ApiProperty({ description: 'Network specification (localized)' })
  network: LocalizedStringDTO;

  @Expose()
  @Type(() => LocalizedStringDTO)
  @ApiProperty({ description: 'Comment (localized)' })
  comment: LocalizedStringDTO;

  @Expose()
  @Type(() => LocalizedStringDTO)
  @ApiProperty({ description: 'Owner (localized)' })
  owner: LocalizedStringDTO;

  @Expose()
  @ApiProperty({ description: 'Virtual Organizations', type: [String] })
  vos: string[];

  @Expose()
  @Type(() => InfrastructureNodeDetailDTO)
  @ApiProperty({
    description: 'List of nodes in the cluster',
    type: [InfrastructureNodeDetailDTO],
  })
  machines: InfrastructureNodeDetailDTO[];
}

/**
 * Organization DTO for detail view (full Perun data)
 */
export class InfrastructureOrganizationDetailDTO {
  @Expose()
  @ApiProperty({ description: 'Organization ID' })
  id: string;

  @Expose()
  @Type(() => LocalizedStringDTO)
  @ApiProperty({ description: 'Organization name (localized)' })
  name: LocalizedStringDTO;

  @Expose()
  @Type(() => InfrastructureClusterDetailDTO)
  @ApiProperty({
    description: 'List of clusters/resources',
    type: [InfrastructureClusterDetailDTO],
  })
  resources: InfrastructureClusterDetailDTO[];
}

/**
 * Main Infrastructure DTO - supports both list and detail views
 */
export class InfrastructureDetailDTO {
  @Expose()
  @ApiProperty({ description: 'Infrastructure type' })
  type: 'Organization' | 'Cluster' | 'Node';

  @Expose()
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Name (can be string or localized object)' })
  name: string | LocalizedStringDTO;

  // Organization fields (only for Organization type)
  @Expose()
  @Type(() => InfrastructureOrganizationDetailDTO)
  @ApiProperty({
    description: 'Full organization data (only for Organization type)',
    required: false,
    nullable: true,
  })
  organization?: InfrastructureOrganizationDetailDTO | null;

  // Cluster fields (only for Cluster type)
  @Expose()
  @Type(() => InfrastructureClusterDetailDTO)
  @ApiProperty({
    description: 'Full cluster data (only for Cluster type)',
    required: false,
    nullable: true,
  })
  cluster?: InfrastructureClusterDetailDTO | null;

  // Node fields (only for Node type)
  @Expose()
  @Type(() => InfrastructureNodeDetailDTO)
  @ApiProperty({
    description: 'Full node data (only for Node type)',
    required: false,
    nullable: true,
  })
  node?: InfrastructureNodeDetailDTO | null;
}
