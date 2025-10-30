import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponse } from '@/common/dto/api-response.dto';

@Controller('outages')
export class OutagesController {
  @Get()
  getOutages(): ApiResponse<any[]> {
    return new ApiResponse([], { totalCount: 0 });
  }

  @Get(':id')
  getOutageDetail(@Param('id') id: string): ApiResponse<any> {
    return new ApiResponse(null);
  }
}
