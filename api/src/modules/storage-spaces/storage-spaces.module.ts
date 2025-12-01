import { Module } from '@nestjs/common';
import { StorageSpacesController } from './storage-spaces.controller';
import { StorageSpacesService } from './storage-spaces.service';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';

@Module({
  imports: [DataCollectionModule],
  controllers: [StorageSpacesController],
  providers: [StorageSpacesService],
})
export class StorageSpacesModule {}
