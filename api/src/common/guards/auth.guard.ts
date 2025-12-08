import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { OidcConfig } from '@/config/oidc.config';
import '@/common/types/session.types';

/**
 * Guard that redirects unauthenticated users to OIDC login
 * Only redirects if MOCK_ADMIN is not enabled
 */
@Injectable()
export class OidcRedirectGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const oidcConfig = this.configService.get<OidcConfig>('oidc');

    // If MOCK_ADMIN is enabled, allow access
    if (oidcConfig?.mockAdmin) {
      return true;
    }

    // Check if user is authenticated (has session)
    if ((request.session as any)?.user) {
      return true;
    }

    // Check if this is already an auth endpoint (avoid redirect loops)
    const path = request.path;
    if (
      path === '/auth/login' ||
      path === '/login' ||
      path.startsWith('/auth/') ||
      path === '/logout' ||
      path === '/user' ||
      path === '/status' ||
      path === '/health'
    ) {
      return true;
    }

    // Redirect to OIDC login
    response.redirect('/api/auth/login');
    return false;
  }
}
