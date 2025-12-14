import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { OidcConfig } from '@/config/oidc.config';
import { UserRole } from '@/common/types/user-context.types';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse as ApiResponseDto } from '@/common/dto/api-response.dto';
import { ApiOkResponseModel } from '@/common/swagger/api-generic-response';
import { CurrentUserDTO } from './dto/current-user.dto';
import { UserContextDecorator } from '@/common/decorators/user-context.decorator';
import { UserContext } from '@/common/types/user-context.types';
import '@/common/types/session.types';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private configService: ConfigService) {}

  @Get('auth/login')
  @UseGuards(AuthGuard('oidc'))
  async login() {
    // This will redirect to OIDC provider
    // The actual redirect is handled by passport-openidconnect
  }

  @Get('login')
  @UseGuards(AuthGuard('oidc'))
  async callback(@Req() req: Request, @Res() res: Response) {
    // After successful authentication, user is attached to req.user by passport
    const user = req.user as any;

    if (!user) {
      throw new UnauthorizedException('Authentication failed');
    }

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
    }

    // Redirect to frontend after successful authentication
    const frontendUrl =
      process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?authenticated=true`);
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    // Destroy session
    req.session?.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
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

    // Check if user is authenticated via Passport
    const user = req.user as any;
    if (user) {
      const role = this.determineUserRole(user);
      return {
        id: user.id || user.sub || '',
        username:
          user.username || user.preferred_username || user.email || 'unknown',
        email: user.email,
        name: user.name,
        role,
      };
    }

    throw new UnauthorizedException('Not authenticated');
  }

  private determineUserRole(user: any): UserRole {
    // Check if user is admin based on groups or other claims
    // This is a placeholder - adjust based on your OIDC provider's claims
    const groups = user.groups || [];
    if (groups.includes('admin') || groups.includes('administrators')) {
      return UserRole.ADMIN;
    }
    return UserRole.USER;
  }
}
