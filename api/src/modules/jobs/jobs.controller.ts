import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@/common/dto/api-response.dto';
import { ApiOkResponseModel } from '@/common/swagger/api-generic-response';
import { JobsService } from './jobs.service';
import { JobsListDTO } from './dto/job-list.dto';
import { MetaDto } from '@/common/dto/meta.dto';

@ApiTags('jobs')
@Controller('pbs/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of jobs',
    description:
      'Returns paginated, sorted, and filtered list of PBS jobs. Supports server-side pagination, sorting, and search.',
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
      'Sort column (id, name, state, owner, node, cpuReserved, gpuReserved, memoryReserved, createdAt). Default: createdAt',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction. Default: desc',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query (searches in job ID, name, owner, node)',
  })
  @ApiOkResponseModel(JobsListDTO, 'List of jobs', MetaDto)
  getJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('search') search?: string,
  ): ApiResponse<JobsListDTO, MetaDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const sortColumn = sort || 'createdAt';
    const sortOrder = order || 'desc';

    const { data, totalCount } = this.jobsService.getJobsList(
      pageNum,
      limitNum,
      sortColumn,
      sortOrder,
      search,
    );

    return new ApiResponse(data, {
      totalCount,
    });
  }
}
