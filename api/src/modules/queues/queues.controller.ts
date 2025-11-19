import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@/common/dto/api-response.dto';
import {
  ApiOkResponseArray,
  ApiOkResponseModel,
} from '@/common/swagger/api-generic-response';
import { QueuesService } from './queues.service';
import { QueuesListDTO } from './dto/queue-list.dto';
import { QueueDetailDTO } from './dto/queue-detail.dto';
import { UserContextDecorator } from '@/common/decorators/user-context.decorator';
import { UserContext } from '@/common/types/user-context.types';

@ApiTags('queues')
@Controller('pbs/queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of all queues',
    description:
      'Returns hierarchical list of queues with routing relationships and user access information. User context is extracted from access token via middleware.',
  })
  @ApiOkResponseModel(QueuesListDTO, 'Hierarchical list of queues')
  getQueues(
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponse<QueuesListDTO> {
    const data = this.queuesService.getQueuesList(userContext);
    return new ApiResponse(data, {
      totalCount: this.countQueues(data.queues),
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get queue detail',
    description:
      'Returns full queue details including ACL information, resources, hierarchical relationships, and user access. User context is extracted from access token via middleware.',
  })
  @ApiOkResponseModel(QueueDetailDTO, 'Queue detail')
  @ApiNotFoundResponse({ description: 'Queue not found' })
  getQueueDetail(
    @Param('id') id: string,
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponse<QueueDetailDTO> {
    const data = this.queuesService.getQueueDetail(id, userContext);
    return new ApiResponse(data);
  }

  /**
   * Recursively count all queues in the hierarchy
   */
  private countQueues(queues: QueuesListDTO['queues']): number {
    let count = queues.length;
    for (const queue of queues) {
      if (queue.children) {
        count += this.countQueues(queue.children);
      }
    }
    return count;
  }
}
