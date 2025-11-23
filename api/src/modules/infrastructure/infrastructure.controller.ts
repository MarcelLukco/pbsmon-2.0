import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@/common/dto/api-response.dto';
import {
  ApiOkResponseArray,
  ApiOkResponseModel,
} from '@/common/swagger/api-generic-response';
import { InfrastructureService } from './infrastructure.service';
import { InfrastructureOrganizationListDTO } from './dto/infrastructure-list.dto';
import { InfrastructureDetailDTO } from './dto/infrastructure-detail.dto';
import { InfrastructureListMetaDto } from './dto/infrastructure-list-meta.dto';

@ApiTags('infrastructure')
@Controller('infrastructure')
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of all infrastructure',
    description:
      'Returns hierarchical list of organizations, clusters, and nodes with limited data and statistics. ID formats: organization-{id}, cluster-{id}, node-{clusterId}-{nodeName}',
  })
  @ApiOkResponseArray(
    InfrastructureOrganizationListDTO,
    'List of infrastructure organizations',
    InfrastructureListMetaDto,
  )
  getInfrastructure(): ApiResponse<
    InfrastructureOrganizationListDTO[],
    InfrastructureListMetaDto
  > {
    const { data, meta } = this.infrastructureService.getInfrastructureList();
    return new ApiResponse(data, meta);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get infrastructure detail',
    description:
      'Returns full infrastructure details by ID. ID formats: organization-{id}, cluster-{id}, node-{clusterId}-{nodeName}',
  })
  @ApiOkResponseModel(InfrastructureDetailDTO, 'Infrastructure detail')
  @ApiNotFoundResponse({ description: 'Infrastructure not found' })
  getInfrastructureDetail(
    @Param('id') id: string,
  ): ApiResponse<InfrastructureDetailDTO> {
    const data = this.infrastructureService.getInfrastructureDetail(id);
    return new ApiResponse(data);
  }
}
