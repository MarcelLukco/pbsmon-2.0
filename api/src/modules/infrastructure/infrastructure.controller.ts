import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponse } from '@/common/dto/api-response.dto';

@Controller('infrastructure')
export class InfrastructureController {
  @Get()
  getInfrastructure(): ApiResponse<any[]> {
    return new ApiResponse([], { totalCount: 0 });
  }

  @Get(':id')
  getInfrastructureDetail(@Param('id') id: string): ApiResponse<any> {
    return new ApiResponse(null);
  }
}
