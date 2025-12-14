import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UserContext, UserRole } from '@/common/types/user-context.types';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import { OidcConfig } from '@/config/oidc.config';

/**
 * Metadata key to skip authentication check
 */
export const SKIP_AUTH_KEY = 'skipAuth';

/**
 * Decorator to skip authentication check for an endpoint
 */
export const SkipAuth = () => SetMetadata(SKIP_AUTH_KEY, true);

@Injectable()
export class UserContextGuard implements CanActivate {
  private readonly isDevelopment: boolean;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private dataCollectionService: DataCollectionService,
  ) {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const skipAuth = this.reflector.get<boolean>(
      SKIP_AUTH_KEY,
      context.getHandler(),
    );
    if (skipAuth) {
      const userContext = this.extractUserContext(request);
      if (userContext) {
        request.userContext = userContext;
      }
      return true;
    }

    const userContext = this.extractUserContext(request);

    // If no user context, return 401 Unauthorized
    // Frontend will handle redirecting to /api/auth/login
    if (!userContext) {
      throw new UnauthorizedException('Authentication required');
    }

    // Handle impersonation: check if X-Impersonate-User header is present
    // Headers are typically lowercased by Express, but check both cases
    const impersonateHeader =
      request.headers['x-impersonate-user'] ||
      request.headers['X-Impersonate-User'];
    if (impersonateHeader) {
      // Only allow admins to impersonate
      if (userContext.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'Only administrators can impersonate users',
        );
      }

      const impersonatedUsername = Array.isArray(impersonateHeader)
        ? impersonateHeader[0]
        : impersonateHeader;

      // Validate that username is a non-empty string
      if (
        !impersonatedUsername ||
        typeof impersonatedUsername !== 'string' ||
        impersonatedUsername.trim() === ''
      ) {
        throw new ForbiddenException('Invalid impersonation username');
      }

      // Look up user's id from pbsmon_users.json
      const userId = await this.getUserIdFromUsername(
        impersonatedUsername.trim(),
      );

      // Create impersonated user context
      // Keep role as USER so admins can see what regular users see
      request.userContext = {
        id: userId || '',
        username: impersonatedUsername.trim(),
        role: UserRole.USER,
      };
      return true;
    }

    // Attach user context to request for use in controllers/services
    request.userContext = userContext;

    return true;
  }

  /**
   * Extract user context from request
   * Priority:
   * 1. MOCK_ADMIN config (if enabled)
   * 2. Session user (from OIDC authentication)
   */
  private extractUserContext(request: any): UserContext | null {
    const oidcConfig = this.configService.get<OidcConfig>('oidc');

    // 1. Check MOCK_ADMIN config
    if (oidcConfig?.mockAdmin) {
      if (!this.isDevelopment) {
        throw new Error('Cannot use MOCK_ADMIN .env and be in production mode');
      }

      return {
        id: 'a026f632ac52748f0e007190fc59241d83783226@einfra.cesnet.cz',
        username: 'admin',
        role: UserRole.ADMIN,
      };
    }

    // 2. Check session (from OIDC login)
    if (request.session?.user) {
      const sessionUser = request.session.user;
      return {
        id: sessionUser.id,
        username: sessionUser.username,
        role: sessionUser.role === 'admin' ? UserRole.ADMIN : UserRole.USER,
      };
    }

    return null;
  }

  /**
   * Get user's AAI id from pbsmon_users.json by username (logname)
   * Returns the id if found, null otherwise
   */
  private async getUserIdFromUsername(
    username: string,
  ): Promise<string | null> {
    try {
      const perunData = this.dataCollectionService.getPerunData();
      if (!perunData?.users?.users) {
        return null;
      }

      const usernameBase = username.split('@')[0];
      for (const user of perunData.users.users) {
        if (
          user.logname === username ||
          user.logname === usernameBase ||
          user.logname.split('@')[0] === usernameBase
        ) {
          return user.id || null;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
