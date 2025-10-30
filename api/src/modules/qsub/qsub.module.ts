import { Module } from '@nestjs/common';
import { QsubController } from './qsub.controller';
import { QsubService } from './qsub.service';

@Module({
  controllers: [QsubController],
  providers: [QsubService]
})
export class QsubModule {}
