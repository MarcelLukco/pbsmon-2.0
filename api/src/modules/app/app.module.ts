import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from '@/modules/tasks/tasks.module';
import { QsubModule } from '@/modules/qsub/qsub.module';
import { QueuesModule } from '@/modules/queues/queues.module';
import { StorageSpacesModule } from '@/modules/storage-spaces/storage-spaces.module';
import { InfrastructureModule } from '@/modules/infrastructure/infrastructure.module';
import { UsersModule } from '@/modules/users/users.module';
import { OutagesModule } from '@/modules/outages/outages.module';
import { NewsModule } from '@/modules/news/news.module';
import { StatusModule } from '@/modules/status/status.module';
import { FairshareModule } from '@/modules/fairshare/fairshare.module';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';
import configuration, {
  prometheusConfig,
  perunConfig,
  pbsConfig,
} from '@/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, prometheusConfig, perunConfig, pbsConfig],
      envFilePath: '.env',
    }),
    TasksModule,
    QsubModule,
    QueuesModule,
    StorageSpacesModule,
    InfrastructureModule,
    UsersModule,
    OutagesModule,
    NewsModule,
    StatusModule,
    FairshareModule,
    DataCollectionModule,
  ],
})
export class AppModule {}
