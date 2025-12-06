import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';
import { UserContextGuard } from '@/common/guards/user-context.guard';

@Module({
  imports: [DataCollectionModule],
  controllers: [QueuesController],
  providers: [
    QueuesService,
    {
      provide: APP_GUARD,
      useClass: UserContextGuard,
    },
  ],
  exports: [QueuesService],
})
export class QueuesModule {}
