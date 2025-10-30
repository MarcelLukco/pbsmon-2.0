import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@/common/dto/api-response.dto';

@Controller('storage-spaces')
export class StorageSpacesController {
  @Get()
  getStorageSpaces(): ApiResponse<any[]> {
    return new ApiResponse([], { totalCount: 0 });
  }
}
