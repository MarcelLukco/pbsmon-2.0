import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponse } from '@/common/dto/api-response.dto';

@Controller('queues')
export class QueuesController {
  @Get()
  getQueues(): ApiResponse<any[]> {
    return new ApiResponse([], { totalCount: 0 });
  }

  @Get(':id')
  getQueueDetail(@Param('id') id: string): ApiResponse<any> {
    return new ApiResponse(null);
  }
}
