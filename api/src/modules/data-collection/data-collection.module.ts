import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DataCollectionController } from './data-collection.controller';
import { DataCollectionService } from './data-collection.service';
import { PerunCollectionService } from './services/perun-collection.service';
import { PrometheusCollectionService } from './services/prometheus-collection.service';
import { PrometheusClient } from './clients/prometheus.client';
import { PbsCollectionService } from './services/pbs-collection.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [DataCollectionController],
  providers: [
    DataCollectionService,
    PerunCollectionService,
    PrometheusCollectionService,
    PrometheusClient,
    PbsCollectionService,
  ],
  exports: [PrometheusClient, PrometheusCollectionService],
})
export class DataCollectionModule {}
