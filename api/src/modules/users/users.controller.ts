import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse as ApiResponseDto } from '@/common/dto/api-response.dto';
import { UserContextDecorator } from '@/common/decorators/user-context.decorator';
import { UserContext, UserRole } from '@/common/types/user-context.types';
import { UsersService } from './users.service';
import { UserDetailDTO } from './dto/user-detail.dto';
import { UsersListDTO } from './dto/user-list.dto';
import { CurrentUserDTO } from './dto/current-user.dto';
import { ApiOkResponseModel } from '@/common/swagger/api-generic-response';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of users',
    description:
      'Returns list of users with summary statistics. Admin sees all users, non-admin sees only themselves.',
  })
  @ApiOkResponseModel(UsersListDTO, 'List of users')
  getUsers(
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponseDto<UsersListDTO> {
    const data = this.usersService.getUsers(userContext);
    return new ApiResponseDto(data, { totalCount: data.users.length });
  }

  @Get('current-user')
  @ApiOperation({
    summary: 'Get current user information',
    description:
      'Returns the current authenticated user information including username and role.',
  })
  @ApiOkResponseModel(CurrentUserDTO, 'Current user')
  getCurrentUser(
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponseDto<CurrentUserDTO> {
    const data: CurrentUserDTO = {
      username: userContext.username,
      role: userContext.role,
    };
    return new ApiResponseDto(data);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user detail',
    description:
      'Returns user details including nickname, fairshare per server, tasks, and CPU tasks. Admin can see all users, non-admin can only see themselves.',
  })
  @ApiOkResponseModel(UserDetailDTO, 'User detail')
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserDetail(
    @Param('id') id: string,
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponseDto<UserDetailDTO> {
    try {
      const data = this.usersService.getUserDetail(id, userContext);
      return new ApiResponseDto(data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`User '${id}' was not found`);
    }
  }
}
