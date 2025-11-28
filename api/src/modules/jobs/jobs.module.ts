import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';
import { UserContextGuard } from '@/common/guards/user-context.guard';

@Module({
  imports: [DataCollectionModule],
  controllers: [JobsController],
  providers: [
    JobsService,
    {
      provide: APP_GUARD,
      useClass: UserContextGuard,
    },
  ],
})
export class JobsModule {}
