import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiResponse } from '@/common/dto/api-response.dto';
import { ApiNotFoundResponse } from '@nestjs/swagger';
import { InfrastructureDTO } from './infrastructure-detail.dto';
import {
  ApiOkResponseArray,
  ApiOkResponseModel,
} from '@/common/swagger/api-generic-response';

@Controller('infrastructure')
export class InfrastructureController {
  @Get()
  @ApiOkResponseArray(InfrastructureDTO, 'List of infrastructure resources')
  getInfrastructure(): ApiResponse<InfrastructureDTO[]> {
    return new ApiResponse([], { totalCount: 0 });
  }

  @Get(':id')
  @ApiOkResponseModel(InfrastructureDTO, 'Infrastructure found')
  @ApiNotFoundResponse({ description: 'Infrastructure not found' })
  getInfrastructureDetail(
    @Param('id') id: string,
  ): ApiResponse<InfrastructureDTO> {
    if (id === '1') {
      throw new NotFoundException(
        `Infrastructure with id '${id}' was not found`,
      );
    }

    return new ApiResponse(new InfrastructureDTO());
  }
}
