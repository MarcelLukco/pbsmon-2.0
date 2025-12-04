import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';

@Module({
  imports: [DataCollectionModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
