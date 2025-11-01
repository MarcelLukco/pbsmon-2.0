import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetaDto } from '@/common/dto/meta.dto';

export class InfrastructureListMetaDto extends MetaDto {
  @ApiProperty({
    description: 'Total number of organizations',
  })
  totalOrganizations: number;

  @ApiProperty({
    description: 'Total number of clusters',
  })
  totalClusters: number;

  @ApiProperty({
    description: 'Total number of nodes',
  })
  totalNodes: number;

  @ApiProperty({
    description: 'Total CPU count across all nodes',
  })
  totalCpu: number;

  @ApiPropertyOptional({
    description: 'Total GPU count across all nodes (if available from PBS)',
    nullable: true,
  })
  totalGpu?: number | null;

  @ApiPropertyOptional({
    description:
      'Total memory across all nodes (in bytes, if available from PBS)',
    nullable: true,
  })
  totalMemory?: number | null;

  @ApiProperty({
    description: 'Number of free nodes',
  })
  freeNodes: number;

  @ApiProperty({
    description: 'Number of partially used nodes',
  })
  partiallyUsedNodes: number;

  @ApiProperty({
    description: 'Number of fully used nodes',
  })
  usedNodes: number;

  @ApiProperty({
    description: 'Number of nodes with unknown state',
  })
  unknownNodes: number;
}
