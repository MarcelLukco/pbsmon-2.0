import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StorageSpaceDTO {
  @Expose()
  @ApiProperty({ description: 'Storage directory path' })
  directory: string;

  @Expose()
  @ApiProperty({ description: 'Used space in TiB' })
  usedTiB: number;

  @Expose()
  @ApiProperty({ description: 'Free space in TiB' })
  freeTiB: number;

  @Expose()
  @ApiProperty({ description: 'Total space in TiB' })
  totalTiB: number;

  @Expose()
  @ApiProperty({ description: 'Usage percentage (0-100)' })
  usagePercent: number;

  @Expose()
  @ApiProperty({
    description: 'Formatted total size (e.g., "524 TiB" or "9.3 PiB")',
  })
  formattedSize: string;
}

export class StorageSpacesDTO {
  @Expose()
  @ApiProperty({
    type: [StorageSpaceDTO],
    description: 'List of storage spaces',
  })
  storageSpaces: StorageSpaceDTO[];

  @Expose()
  @ApiProperty({ description: 'Total storage space in TiB' })
  totalTiB: number;

  @Expose()
  @ApiProperty({ description: 'Total used space in TiB' })
  totalUsedTiB: number;

  @Expose()
  @ApiProperty({ description: 'Total free space in TiB' })
  totalFreeTiB: number;

  @Expose()
  @ApiProperty({ description: 'Formatted total storage (e.g., "37215 TiB")' })
  formattedTotal: string;

  @Expose()
  @ApiProperty({ description: 'Formatted total used (e.g., "32575 TiB")' })
  formattedTotalUsed: string;

  @Expose()
  @ApiProperty({ description: 'Formatted total free (e.g., "4639 TiB")' })
  formattedTotalFree: string;
}
