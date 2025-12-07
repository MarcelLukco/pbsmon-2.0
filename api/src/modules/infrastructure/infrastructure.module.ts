import { Module } from '@nestjs/common';
import { InfrastructureController } from './infrastructure.controller';
import { InfrastructureService } from './infrastructure.service';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';
import { AccountingModule } from '@/modules/accounting/accounting.module';

@Module({
  imports: [DataCollectionModule, AccountingModule],
  controllers: [InfrastructureController],
  providers: [InfrastructureService],
  exports: [InfrastructureService],
})
export class InfrastructureModule {}
