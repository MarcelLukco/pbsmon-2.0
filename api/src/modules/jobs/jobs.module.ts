import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';

@Module({
  imports: [DataCollectionModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
