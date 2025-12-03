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
    description:
      'Fairshare rankings per server (1 = best, higher = worse). Only for users with jobs.',
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
