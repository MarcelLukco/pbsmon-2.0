import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * Queue DTO for list view
 */
export class QueueListDTO {
  @Expose()
  @ApiProperty({ description: 'Queue name' })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'Queue type',
    enum: ['Execution', 'Route'],
  })
  queueType: 'Execution' | 'Route';

  @Expose()
  @ApiProperty({ description: 'Queue priority', nullable: true })
  priority?: number | null;

  @Expose()
  @ApiProperty({ description: 'Total number of jobs', nullable: true })
  totalJobs?: number | null;

  @Expose()
  @ApiProperty({ description: 'Is queue enabled' })
  enabled: boolean;

  @Expose()
  @ApiProperty({ description: 'Is queue started' })
  started: boolean;

  @Expose()
  @ApiProperty({
    description: 'Whether the current user has access to this queue',
    required: false,
  })
  hasAccess?: boolean;

  @Expose()
  @Type(() => QueueListDTO)
  @ApiProperty({
    description: 'Child queues (queues that this queue routes to)',
    type: [QueueListDTO],
    required: false,
  })
  children?: QueueListDTO[];
}

/**
 * Hierarchical queues DTO - root level queues with their children
 */
export class QueuesListDTO {
  @Expose()
  @Type(() => QueueListDTO)
  @ApiProperty({
    description:
      'Root level queues (typically Route queues) with their hierarchical children',
    type: [QueueListDTO],
  })
  queues: QueueListDTO[];
}
