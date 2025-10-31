import { ApiPropertyOptional } from '@nestjs/swagger';

export class MetaDto {
  @ApiPropertyOptional({
    description: 'Total number of items across all pages',
  })
  totalCount?: number;
}
