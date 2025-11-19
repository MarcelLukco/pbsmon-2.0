import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UserContext, UserRole } from '@/common/types/user-context.types';

/**
 * Metadata key for user context
 */
export const USER_CONTEXT_KEY = 'userContext';

/**
 * Decorator to mark endpoints that require user context
 * (Currently optional, will be required when authentication is implemented)
 */
export const RequireUserContext = () => SetMetadata(USER_CONTEXT_KEY, true);

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
  ) {
    // Check if we're in development mode
    this.isDevelopment =
      process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'prod';
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const userContext = this.extractUserContext(request);

    // If no user context and not in dev mode, deny access
    if (!userContext) {
      throw new ForbiddenException(
        'Authentication required. Please provide a valid access token.',
      );
    }

    // Attach user context to request for use in controllers/services
    request.userContext = userContext;

    return true;
  }

  /**
   * Extract user context from request
   * In dev mode: returns admin context
   * In production: extracts from access token
   */
  private extractUserContext(request: any): UserContext | null {
    // Development mode: return admin context
    if (this.isDevelopment) {
      return {
        username: 'admin',
        role: UserRole.ADMIN,
        groups: [], // Admin has access to everything, groups not needed
        hostname: undefined,
      };
    }

    // Production mode: extract from access token
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);

    // TODO: Implement token parsing and validation
    // const decodedToken = this.validateAndDecodeToken(token);
    // if (!decodedToken) {
    //   return null;
    // }

    // Extract user information from token claims
    // return {
    //   username: decodedToken.username,
    //   role: decodedToken.role as UserRole,
    //   groups: decodedToken.groups || [],
    //   hostname: decodedToken.hostname,
    // };

    // For now, if token is provided but we can't parse it, deny access
    // This will be implemented when authentication is added
    return null;
  }

  /**
   * Validate and decode access token
   * TODO: Implement OIDC token validation
   */
  // private validateAndDecodeToken(token: string): any | null {
  //   try {
  //     // Validate token signature, expiration, etc.
  //     // Decode and return token claims
  //     return false
  //   } catch (error) {
  //     return null;
  //   }
  // }
}
