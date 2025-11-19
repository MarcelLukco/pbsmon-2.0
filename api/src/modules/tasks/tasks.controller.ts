import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponse, ApiError } from '@/common/dto/api-response.dto';

@Controller('pbs/tasks')
export class TasksController {
  @Get()
  getTasks(): ApiResponse<any[]> {
    // Blank implementation, just structure
    return new ApiResponse([], { totalCount: 0 });
  }

  @Get(':id')
  getTaskDetail(@Param('id') id: string): ApiResponse<any> {
    // Blank implementation, just structure
    return new ApiResponse(null);
  }
}
