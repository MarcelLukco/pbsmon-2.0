import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UserContext, UserRole } from '@/common/types/user-context.types';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import { OidcConfig } from '@/config/oidc.config';

/**
 * Metadata key for user context
 */
export const USER_CONTEXT_KEY = 'userContext';

/**
 * Metadata key to skip authentication check
 */
export const SKIP_AUTH_KEY = 'skipAuth';

/**
 * Decorator to mark endpoints that require user context
 * (Currently optional, will be required when authentication is implemented)
 */
export const RequireUserContext = () => SetMetadata(USER_CONTEXT_KEY, true);

/**
 * Decorator to skip authentication check for an endpoint
 */
export const SkipAuth = () => SetMetadata(SKIP_AUTH_KEY, true);

/**
 * Guard that extracts user context from request and enforces authorization
 * - In development mode: sets admin user context automatically
 * - In production: requires valid access token, returns 403 if unauthorized
 */
@Injectable()
export class UserContextGuard implements CanActivate {
  private readonly isDevelopment: boolean;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private dataCollectionService: DataCollectionService,
  ) {
    // Check if we're in development mode
    this.isDevelopment =
      process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'prod';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const path = request.path;

    // Check if endpoint is marked to skip auth
    const skipAuth = this.reflector.get<boolean>(
      SKIP_AUTH_KEY,
      context.getHandler(),
    );
    if (skipAuth) {
      // For endpoints that skip auth, still try to extract user context if available
      // but don't require it
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
        groups: userContext.groups || [],
        hostname: userContext.hostname,
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
   * 3. Bearer token (for API calls)
   */
  private extractUserContext(request: any): UserContext | null {
    const oidcConfig = this.configService.get<OidcConfig>('oidc');

    // 1. Check MOCK_ADMIN config
    if (oidcConfig?.mockAdmin) {
      return {
        id: 'a026f632ac52748f0e007190fc59241d83783226@einfra.cesnet.cz',
        username: 'admin',
        role: UserRole.ADMIN,
        groups: [],
        hostname: undefined,
      };
    }

    // 2. Check session (from OIDC login)
    if (request.session?.user) {
      const sessionUser = request.session.user;
      return {
        id: sessionUser.id || sessionUser.sub || '',
        username:
          sessionUser.username ||
          sessionUser.preferred_username ||
          sessionUser.email ||
          'unknown',
        role: this.determineUserRole(sessionUser),
        groups: sessionUser.groups || [],
        hostname: undefined,
      };
    }

    // 3. Check Bearer token (for API calls)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = this.validateAndDecodeToken(token);
      if (decodedToken) {
        return {
          id: decodedToken.sub || decodedToken.id || '',
          username:
            decodedToken.preferred_username ||
            decodedToken.username ||
            decodedToken.email ||
            'unknown',
          role: this.determineUserRole(decodedToken),
          groups: decodedToken.groups || [],
          hostname: undefined,
        };
      }
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

      // Look for user by logname (exact match or without @domain)
      const usernameBase = username.split('@')[0];
      for (const user of perunData.users.users) {
        if (
          user.logname === username ||
          user.logname === usernameBase ||
          user.logname.split('@')[0] === usernameBase
        ) {
          // Return the id if available, otherwise return null
          return user.id || null;
        }
      }

      return null;
    } catch (error) {
      // If lookup fails, return null (will use empty string as fallback)
      return null;
    }
  }

  /**
   * Determine user role from user object/claims
   */
  private determineUserRole(user: any): UserRole {
    // Check if user is admin based on groups or other claims
    const groups = user.groups || [];
    const roles = user.roles || [];

    if (
      groups.includes('admin') ||
      groups.includes('administrators') ||
      roles.includes('admin') ||
      roles.includes('administrator') ||
      user.role === 'admin' ||
      user.role === 'administrator'
    ) {
      return UserRole.ADMIN;
    }
    return UserRole.USER;
  }

  /**
   * Validate and decode access token
   * For now, we decode the JWT without verification (for development)
   * In production, you should verify the token signature against the OIDC issuer
   */
  private validateAndDecodeToken(token: string): any | null {
    try {
      // Simple JWT decoding (without verification)
      // In production, use a library like jwks-rsa to verify tokens
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8'),
      );

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }
}
