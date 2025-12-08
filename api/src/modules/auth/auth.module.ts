import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { OidcStrategy } from './oidc.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'oidc' })],
  controllers: [AuthController],
  providers: [OidcStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
