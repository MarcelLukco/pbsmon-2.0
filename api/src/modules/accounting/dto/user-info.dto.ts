import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class UserUsageDTO {
  @Expose()
  @ApiProperty({ description: 'Year number' })
  year: number;

  @Expose()
  @ApiProperty({ description: 'Number of jobs in this year' })
  jobCount: number;

  @Expose()
  @ApiProperty({ description: 'Total CPU time used in this year (seconds)' })
  cpuTime: number;
}

export class UserInfoDTO {
  @Expose()
  @ApiProperty({ description: 'Total number of jobs' })
  jobCount: number;

  @Expose()
  @ApiProperty({ description: 'Total CPU time used (seconds)' })
  totalCpuTime: number;

  @Expose()
  @Type(() => UserUsageDTO)
  @ApiProperty({
    description: 'Usage breakdown by year',
    type: [UserUsageDTO],
  })
  usages: UserUsageDTO[];
}
