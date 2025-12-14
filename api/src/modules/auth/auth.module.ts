import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { OidcService } from './oidc.service';
import { DataCollectionModule } from '@/modules/data-collection/data-collection.module';

@Module({
  imports: [DataCollectionModule],
  controllers: [AuthController],
  providers: [OidcService],
  exports: [OidcService],
})
export class AuthModule {}
