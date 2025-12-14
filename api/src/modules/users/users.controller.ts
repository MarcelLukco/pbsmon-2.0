import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ApiResponse as ApiResponseDto } from '@/common/dto/api-response.dto';
import { UserContextDecorator } from '@/common/decorators/user-context.decorator';
import { UserContext, UserRole } from '@/common/types/user-context.types';
import { UsersService } from './users.service';
import { UserDetailDTO } from './dto/user-detail.dto';
import { UsersListDTO } from './dto/user-list.dto';
import { GroupsListDTO } from './dto/group-list.dto';
import { GroupDetailDTO } from './dto/group-detail.dto';
import { ApiOkResponseModel } from '@/common/swagger/api-generic-response';
import { MetaDto } from '@/common/dto/meta.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of users',
    description:
      'Returns paginated, sorted, and filtered list of users with summary statistics. Admin sees all users. Non-admin sees themselves and users from their groups (excluding system-wide groups that contain 80%+ of all Metacentrum users). Returns ALL Perun users, including those without jobs.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based). Default: 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page. Default: 20',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description:
      'Sort column (username, nickname, totalTasks, queuedTasks, runningTasks, doneTasks, cpuTasks, fairshare-{serverName}). Default: username',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction. Default: asc',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query (searches in username and nickname)',
  })
  @ApiOkResponseModel(UsersListDTO, 'List of users', MetaDto)
  getUsers(
    @UserContextDecorator() userContext: UserContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('search') search?: string,
  ): ApiResponseDto<UsersListDTO, MetaDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const sortColumn = sort || 'username';
    // Default to desc for fairshare sorting, asc for others
    const sortOrder =
      order || (sortColumn.startsWith('fairshare-') ? 'desc' : 'asc');

    const { data, totalCount, maxFairshare } = this.usersService.getUsers(
      userContext,
      pageNum,
      limitNum,
      sortColumn,
      sortOrder,
      search,
    );

    return new ApiResponseDto(data, { totalCount, maxFairshare });
  }

  @Get('/detail/:id')
  @ApiOperation({
    summary: 'Get user detail',
    description:
      'Returns user details including nickname, fairshare per server, tasks, and CPU tasks. Admin can see all users. Non-admin can see themselves and users from their groups (excluding system-wide groups that contain 80%+ of all Metacentrum users).',
  })
  @ApiOkResponseModel(UserDetailDTO, 'User detail')
  @ApiNotFoundResponse({ description: 'User not found' })
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

  @Get('groups')
  @ApiOperation({
    summary: 'Get list of all groups',
    description:
      'Returns list of all groups with name, GID, and member count. Admin sees all groups. Non-admin sees only groups they are a member of, and groups containing more than 80% of all Metacentrum users (system-wide groups like "meta" and "storage") are filtered out.',
  })
  @ApiOkResponseModel(GroupsListDTO, 'List of groups')
  getGroups(
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponseDto<GroupsListDTO> {
    const data = this.usersService.getGroups(userContext);
    return new ApiResponseDto(data);
  }

  @Get('groups/:name')
  @ApiOperation({
    summary: 'Get group detail',
    description:
      'Returns group details including list of members (only nickname and name). Admin can see any group, non-admin can only see groups they are a member of.',
  })
  @ApiOkResponseModel(GroupDetailDTO, 'Group detail')
  @ApiNotFoundResponse({ description: 'Group not found' })
  getGroupDetail(
    @Param('name') name: string,
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponseDto<GroupDetailDTO> {
    try {
      const data = this.usersService.getGroupDetail(name, userContext);
      return new ApiResponseDto(data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Group '${name}' was not found`);
    }
  }
}
