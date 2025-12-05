import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OutageRecordDTO {
  @Expose()
  @ApiProperty({ description: 'Hostname of the node' })
  hostname: string;

  @Expose()
  @ApiProperty({ description: 'Type of outage' })
  type: string;

  @Expose()
  @ApiProperty({ description: 'Start time of the outage', nullable: true })
  startTime: Date | null;

  @Expose()
  @ApiProperty({ description: 'End time of the outage', nullable: true })
  endTime: Date | null;

  @Expose()
  @ApiProperty({ description: 'Comment about the outage', nullable: true })
  comment: string | null;
}
