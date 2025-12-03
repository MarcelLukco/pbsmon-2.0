import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * User List DTO - summary information for list view
 */
export class UserListDTO {
  @Expose()
  @ApiProperty({ description: 'User login name (username)' })
  username: string;

  @Expose()
  @ApiProperty({
    description: 'User nickname (full name from Perun)',
    nullable: true,
  })
  nickname?: string | null;

  @Expose()
  @ApiProperty({ description: 'Total number of tasks (all job states)' })
  totalTasks: number;

  @Expose()
  @ApiProperty({ description: 'Number of queued tasks' })
  queuedTasks: number;

  @Expose()
  @ApiProperty({ description: 'Number of running tasks' })
  runningTasks: number;

  @Expose()
  @ApiProperty({ description: 'Number of done tasks (begun + exiting)' })
  doneTasks: number;

  @Expose()
  @ApiProperty({
    description: 'Number of CPU tasks (running jobs with CPU resources)',
  })
  cpuTasks: number;

  @Expose()
  @ApiProperty({
    description: 'CPU resources in queued jobs',
  })
  queuedCPU: number;

  @Expose()
  @ApiProperty({
    description: 'CPU resources in running jobs',
  })
  runningCPU: number;

  @Expose()
  @ApiProperty({
    description: 'CPU resources in done jobs (begun + exiting)',
  })
  doneCPU: number;

  @Expose()
  @ApiProperty({
    description: 'Total CPU resources across all jobs',
  })
  totalCPU: number;

  @Expose()
  @ApiProperty({
    description: 'GPU resources in queued jobs',
  })
  queuedGPU: number;

  @Expose()
  @ApiProperty({
    description: 'GPU resources in running jobs',
  })
  runningGPU: number;

  @Expose()
  @ApiProperty({
    description: 'GPU resources in done jobs (begun + exiting)',
  })
  doneGPU: number;

  @Expose()
  @ApiProperty({
    description: 'Total GPU resources across all jobs',
  })
  totalGPU: number;

  @Expose()
  @ApiProperty({
    description:
      'Fairshare rankings per server (higher number = better, opposite ranking). Only for users with jobs.',
    type: 'object',
    additionalProperties: { type: 'number' },
    nullable: true,
  })
  fairshareRankings?: Record<string, number> | null;
}

/**
 * Users List DTO
 */
export class UsersListDTO {
  @Expose()
  @ApiProperty({
    description: 'List of users',
    type: [UserListDTO],
  })
  users: UserListDTO[];

  @Expose()
  @ApiProperty({
    description: 'List of fairshare server names',
    type: [String],
  })
  fairshareServers: string[];
}
