import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SkipAuth } from '@/common/guards/user-context.guard';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OidcConfig } from '@/config/oidc.config';
import { UserRole } from '@/common/types/user-context.types';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse as ApiResponseDto } from '@/common/dto/api-response.dto';
import { ApiOkResponseModel } from '@/common/swagger/api-generic-response';
import { CurrentUserDTO } from './dto/current-user.dto';
import { UserContextDecorator } from '@/common/decorators/user-context.decorator';
import { UserContext } from '@/common/types/user-context.types';
import { OidcService } from './oidc.service';
import '@/common/types/session.types';

@ApiTags('auth')
@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private configService: ConfigService,
    private oidcService: OidcService,
  ) {}

  @Get('auth/login')
  @SkipAuth()
  async login(@Req() req: Request, @Res() res: Response) {
    if (!this.oidcService.isConfigured()) {
      this.logger.error('OIDC is not configured');
      throw new UnauthorizedException('OIDC authentication not available');
    }

    const authData = await this.oidcService.getAuthorizationUrl();
    if (!authData) {
      throw new UnauthorizedException('Failed to generate authorization URL');
    }

    // Store state and code verifier in session
    if (req.session) {
      (req.session as any).oidcState = authData.state;
      (req.session as any).oidcCodeVerifier = authData.codeVerifier;
    }

    this.logger.log('Redirecting to OIDC provider', { state: authData.state });
    res.redirect(authData.url);
  }

  @Get('login')
  @SkipAuth()
  async callback(@Req() req: Request, @Res() res: Response) {
    this.logger.log('OIDC callback received', {
      path: req.path,
      query: req.query,
    });

    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      this.logger.error('OIDC callback error', {
        error,
        error_description: req.query.error_description,
      });
      throw new UnauthorizedException(`Authentication failed: ${error}`);
    }

    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    // Get stored state and code verifier from session
    const session = req.session as any;
    const storedState = session?.oidcState;
    const storedCodeVerifier = session?.oidcCodeVerifier;

    if (!storedState || !storedCodeVerifier) {
      this.logger.error('OIDC callback: Missing session data');
      throw new UnauthorizedException('Session expired or invalid');
    }

    try {
      // Build the callback URL from the request
      const protocol = req.protocol || (req.secure ? 'https' : 'http');
      const host = req.get('host') || 'localhost';
      const fullUrl = `${protocol}://${host}${req.originalUrl || req.url}`;
      const callbackUrl = new URL(fullUrl);
      
      // Handle the callback and get user info
      const user = await this.oidcService.handleCallback(
        callbackUrl,
        storedState,
        storedCodeVerifier,
      );

      this.logger.log('OIDC callback: User authenticated', {
        id: user.id,
        username: user.username,
      });

      // Store user in session for future requests
      if (req.session) {
        (req.session as any).user = {
          id: user.id || user.sub || '',
          username:
            user.username || user.preferred_username || user.email || 'unknown',
          email: user.email,
          name: user.name,
          groups: user.groups || [],
          roles: user.roles || [],
          sub: user.sub,
          ...user, // Store all user data
        };

        // Clean up OIDC session data
        delete (req.session as any).oidcState;
        delete (req.session as any).oidcCodeVerifier;
      }

      // Redirect to frontend after successful authentication
      const frontendUrl =
        process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/?authenticated=true`);
    } catch (error) {
      this.logger.error('OIDC callback processing error', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    // Destroy session
    req.session?.destroy((err) => {
      if (err) {
        this.logger.error('Error destroying session:', err);
      }
    });

    const frontendUrl =
      process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';
    res.redirect(frontendUrl);
  }

  @Get('auth/current-user')
  @ApiOperation({
    summary: 'Get current user information',
    description:
      'Returns the current authenticated user information including username and role.',
  })
  @ApiOkResponseModel(CurrentUserDTO, 'Current user')
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getCurrentUser(
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponseDto<CurrentUserDTO> {
    if (!userContext) {
      throw new UnauthorizedException('Not authenticated');
    }

    const data: CurrentUserDTO = {
      username: userContext.username,
      role: userContext.role,
    };
    return new ApiResponseDto(data);
  }

  @Get('user')
  async getUser(@Req() req: Request) {
    // Check session first
    if ((req.session as any)?.user) {
      const sessionUser = (req.session as any).user;
      const role = this.determineUserRole(sessionUser);
      return {
        id: sessionUser.id || sessionUser.sub || '',
        username:
          sessionUser.username ||
          sessionUser.preferred_username ||
          sessionUser.email ||
          'unknown',
        email: sessionUser.email,
        name: sessionUser.name,
        role,
      };
    }

    // User should be in session if authenticated

    throw new UnauthorizedException('Not authenticated');
  }

  private determineUserRole(user: any): UserRole {
    // Check if user is admin based on groups or other claims
    // This is a placeholder - adjust based on your OIDC provider's claims
    const groups = user.groups || [];
    this.logger.log('groups', groups);
    if (groups.includes('admin') || groups.includes('administrators')) {
      return UserRole.ADMIN;
    }
    return UserRole.USER;
  }
}
