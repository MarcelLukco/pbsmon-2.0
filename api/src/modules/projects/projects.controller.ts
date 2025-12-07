import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { ApiResponse as ApiResponseDto } from '@/common/dto/api-response.dto';
import { UserContextDecorator } from '@/common/decorators/user-context.decorator';
import { UserContext } from '@/common/types/user-context.types';
import { ProjectsService } from './projects.service';
import { ProjectsListDTO, ProjectDetailDTO } from './dto/project.dto';
import { ApiOkResponseModel } from '@/common/swagger/api-generic-response';
import { MetaDto } from '@/common/dto/meta.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of projects',
    description:
      'Returns paginated, sorted, and filtered list of OpenStack projects. Admin sees all projects. Regular users see only projects they are members of (including personal project if applicable).',
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
      'Sort column (name, status, createdAt, vmCount, vcpus, memoryGb). Default: name',
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
    description: 'Search query (searches in name, description, and id)',
  })
  @ApiOkResponseModel(ProjectsListDTO, 'List of projects', MetaDto)
  async getProjects(
    @UserContextDecorator() userContext: UserContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('search') search?: string,
  ): Promise<ApiResponseDto<ProjectsListDTO, MetaDto>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const sortColumn = sort || 'name';
    const sortOrder = order || 'asc';

    const { data, totalCount } = await this.projectsService.getProjects(
      userContext,
      pageNum,
      limitNum,
      sortColumn,
      sortOrder,
      search,
    );

    return new ApiResponseDto(data, { totalCount });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project detail',
    description:
      'Returns detailed information about a specific project including VMs/servers. Admin can see any project. Regular users can only see projects they are members of.',
  })
  @ApiParam({
    name: 'id',
    description: 'Project ID',
    type: String,
  })
  @ApiOkResponseModel(ProjectDetailDTO, 'Project detail')
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectDetail(
    @Param('id') id: string,
    @UserContextDecorator() userContext: UserContext,
  ): Promise<ApiResponseDto<ProjectDetailDTO>> {
    try {
      const data = await this.projectsService.getProjectDetail(id, userContext);
      return new ApiResponseDto(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new NotFoundException(`Project '${id}' was not found`);
    }
  }
}
