import { Module } from '@nestjs/common';
import { QsubController } from './qsub.controller';
import { QsubService } from './qsub.service';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';
import { InfrastructureModule } from '@/modules/infrastructure/infrastructure.module';
import { QueuesModule } from '@/modules/queues/queues.module';

@Module({
  imports: [DataCollectionModule, InfrastructureModule, QueuesModule],
  controllers: [QsubController],
  providers: [QsubService],
})
export class QsubModule {}
