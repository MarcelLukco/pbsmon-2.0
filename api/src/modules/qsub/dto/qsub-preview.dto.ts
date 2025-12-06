import { ApiProperty } from '@nestjs/swagger';
import { InfrastructureNodeListDTO } from '@/modules/infrastructure/dto/infrastructure-list.dto';

export class QsubPreviewRequestDto {
  @ApiProperty({ required: false })
  walltime?: string;

  @ApiProperty({ required: false })
  queue?: string;

  @ApiProperty()
  ncpu: number;

  @ApiProperty({ required: false })
  memory?: { amount: number; unit: 'mb' | 'gb' };

  @ApiProperty({ required: false })
  ngpu?: number;

  @ApiProperty({ required: false })
  gpu_memory?: { amount: number; unit: 'mb' | 'gb' };

  @ApiProperty({ required: false })
  scratch_type?: string;

  @ApiProperty({ required: false })
  scratch_memory?: number;

  @ApiProperty({ required: false })
  cluster?: string;

  @ApiProperty({ required: false })
  vnode?: string;

  @ApiProperty({ required: false })
  place?: string;

  @ApiProperty({ required: false })
  arch?: string;

  @ApiProperty({ required: false, type: [String] })
  cgroups?: string[];

  @ApiProperty({ required: false, type: [String] })
  cpu_flag?: string[];

  @ApiProperty({ required: false })
  cpu_vendor?: string;

  @ApiProperty({ required: false, type: [String] })
  gpu_cap?: string[];

  @ApiProperty({ required: false, type: [String] })
  host_licenses?: string[];

  @ApiProperty({ required: false })
  luna?: string;

  @ApiProperty({ required: false })
  pbs_server?: string;

  @ApiProperty({ required: false })
  singularity?: boolean;

  @ApiProperty({ required: false })
  spec?: number;

  @ApiProperty({ required: false })
  osfamily?: string;

  @ApiProperty({ required: false })
  os?: string;

  @ApiProperty({ required: false })
  umg?: boolean;
}

export class QualifiedNodeDto extends InfrastructureNodeListDTO {
  @ApiProperty()
  canRunImmediately: boolean;
}

export class QsubPreviewResponseDto {
  @ApiProperty()
  qsubCommand: string;

  @ApiProperty()
  qsubScript: string;

  @ApiProperty({ type: [QualifiedNodeDto] })
  qualifiedNodes: QualifiedNodeDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  immediatelyAvailableCount: number;
}
