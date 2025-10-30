import { Module } from '@nestjs/common';
import { TasksModule } from '@/modules/tasks/tasks.module';
import { QsubModule } from '@/modules/qsub/qsub.module';
import { QueuesModule } from '@/modules/queues/queues.module';
import { StorageSpacesModule } from '@/modules/storage-spaces/storage-spaces.module';
import { InfrastructureModule } from '@/modules/infrastructure/infrastructure.module';
import { UsersModule } from '@/modules/users/users.module';
import { OutagesModule } from '@/modules/outages/outages.module';
import { NewsModule } from '@/modules/news/news.module';
import { StatusModule } from '@/modules/status/status.module';

@Module({
  imports: [
    TasksModule,
    QsubModule,
    QueuesModule,
    StorageSpacesModule,
    InfrastructureModule,
    UsersModule,
    OutagesModule,
    NewsModule,
    StatusModule,
  ],
})
export class AppModule {}
