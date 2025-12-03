import { ApiPropertyOptional } from '@nestjs/swagger';

export class MetaDto {
  @ApiPropertyOptional({
    description: 'Total number of items across all pages',
  })
  totalCount?: number;

  @ApiPropertyOptional({
    description: 'Maximum fairshare ranking per server (worst ranking)',
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  maxFairshare?: Record<string, number>;
}
