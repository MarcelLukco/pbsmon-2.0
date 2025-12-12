import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QsubModule } from '@/modules/qsub/qsub.module';
import { QueuesModule } from '@/modules/queues/queues.module';
import { StorageSpacesModule } from '@/modules/storage-spaces/storage-spaces.module';
import { InfrastructureModule } from '@/modules/infrastructure/infrastructure.module';
import { UsersModule } from '@/modules/users/users.module';
import { GroupsModule } from '@/modules/groups/groups.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { StatusModule } from '@/modules/status/status.module';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';
import { AccountingModule } from '@/modules/accounting/accounting.module';
import { ProjectsModule } from '@/modules/projects/projects.module';
import configuration, {
  prometheusConfig,
  perunConfig,
  pbsConfig,
  accountingConfig,
} from '@/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        configuration,
        prometheusConfig,
        perunConfig,
        pbsConfig,
        accountingConfig,
      ],
      envFilePath: '.env',
    }),
    QsubModule,
    QueuesModule,
    StorageSpacesModule,
    InfrastructureModule,
    UsersModule,
    GroupsModule,
    JobsModule,
    StatusModule,
    DataCollectionModule,
    AccountingModule,
    ProjectsModule,
  ],
})
export class AppModule {}
