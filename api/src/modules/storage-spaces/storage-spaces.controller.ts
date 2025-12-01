import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiResponse } from '@/common/dto/api-response.dto';
import { ApiOkResponseModel } from '@/common/swagger/api-generic-response';
import { StorageSpacesService } from './storage-spaces.service';
import { StorageSpacesDTO } from './dto/storage-space.dto';

@ApiTags('storage-spaces')
@Controller('storage-spaces')
export class StorageSpacesController {
  constructor(private readonly storageSpacesService: StorageSpacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all storage spaces' })
  @ApiOkResponseModel(StorageSpacesDTO, 'Storage spaces data')
  async getStorageSpaces(): Promise<ApiResponse<StorageSpacesDTO>> {
    const data = await this.storageSpacesService.getStorageSpaces();
    return new ApiResponse(data);
  }
}
