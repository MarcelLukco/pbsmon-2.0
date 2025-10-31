import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class InfrastructureDTO {
  @Expose()
  @ApiProperty({ description: 'Infrastructure ID' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Infrastructure name' })
  name: string;
}
