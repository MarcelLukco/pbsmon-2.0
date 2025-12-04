import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@/common/dto/api-response.dto';
import { ApiOkResponseModel } from '@/common/swagger/api-generic-response';
import { GroupsService } from './groups.service';
import { GroupsListDTO } from './dto/group-list.dto';
import { GroupDetailDTO } from './dto/group-detail.dto';
import { UserContext } from '@/common/types/user-context.types';
import { UserContextDecorator } from '@/common/decorators/user-context.decorator';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of all groups',
    description:
      'Returns list of all groups with name, GID, and member count. Admin sees all groups. Non-admin sees only groups they are a member of, and groups containing more than 80% of all Metacentrum users (system-wide groups like "meta" and "storage") are filtered out.',
  })
  @ApiOkResponseModel(GroupsListDTO, 'List of groups')
  getGroups(
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponse<GroupsListDTO> {
    const data = this.groupsService.getGroups(userContext);
    return new ApiResponse(data);
  }

  @Get(':name')
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
  ): ApiResponse<GroupDetailDTO> {
    try {
      const data = this.groupsService.getGroupDetail(name, userContext);
      return new ApiResponse(data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Group '${name}' was not found`);
    }
  }
}
