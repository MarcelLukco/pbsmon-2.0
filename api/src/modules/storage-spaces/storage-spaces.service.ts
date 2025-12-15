import { Injectable, Logger } from '@nestjs/common';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import { StorageSpaceDTO, StorageSpacesDTO } from './dto/storage-space.dto';

@Injectable()
export class StorageSpacesService {
  private readonly logger = new Logger(StorageSpacesService.name);

  constructor(private readonly dataCollectionService: DataCollectionService) {}

  async getStorageSpaces(): Promise<StorageSpacesDTO> {
    const storageSpaces = this.dataCollectionService.getStorageSpaces();

    if (!storageSpaces) {
      this.logger.warn('Storage spaces data not available');
      return {
        storageSpaces: [],
        totalTiB: 0,
        totalUsedTiB: 0,
        totalFreeTiB: 0,
        formattedTotal: '0 TiB',
        formattedTotalUsed: '0 TiB',
        formattedTotalFree: '0 TiB',
      };
    }

    const storageSpaceDTOs: StorageSpaceDTO[] = storageSpaces.storageSpaces.map(
      (space) => ({
        directory: space.directory,
        usedTiB: space.usedTiB,
        freeTiB: space.freeTiB,
        totalTiB: space.totalTiB,
        usagePercent: space.usagePercent,
        formattedSize: space.formattedSize,
      }),
    );

    return {
      storageSpaces: storageSpaceDTOs,
      totalTiB: storageSpaces.totalTiB,
      totalUsedTiB: storageSpaces.totalUsedTiB,
      totalFreeTiB: storageSpaces.totalFreeTiB,
      formattedTotal: storageSpaces.formattedTotal,
      formattedTotalUsed: storageSpaces.formattedTotalUsed,
      formattedTotalFree: storageSpaces.formattedTotalFree,
    };
  }
}
