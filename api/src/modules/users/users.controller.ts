import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponse } from '@/common/dto/api-response.dto';

@Controller('users')
export class UsersController {
  @Get()
  getUsers(): ApiResponse<any[]> {
    return new ApiResponse([], { totalCount: 0 });
  }

  @Get(':id')
  getUserDetail(@Param('id') id: string): ApiResponse<any> {
    return new ApiResponse(null);
  }
}
