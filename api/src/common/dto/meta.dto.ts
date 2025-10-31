import { ApiPropertyOptional } from '@nestjs/swagger';

export class MetaDto {
  @ApiPropertyOptional({
    description: 'Total number of items across all pages',
  })
  totalCount?: number;

  @ApiPropertyOptional({ description: 'Current page index (1-based)' })
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  pageSize?: number;

  @ApiPropertyOptional({ description: 'Total number of pages' })
  totalPages?: number;
}
