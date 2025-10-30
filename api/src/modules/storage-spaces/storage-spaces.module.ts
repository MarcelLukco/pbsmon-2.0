import { Module } from '@nestjs/common';
import { StorageSpacesController } from './storage-spaces.controller';
import { StorageSpacesService } from './storage-spaces.service';

@Module({
  controllers: [StorageSpacesController],
  providers: [StorageSpacesService]
})
export class StorageSpacesModule {}
