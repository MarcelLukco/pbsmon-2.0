import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('status')
@Controller('status')
export class StatusController {
  @Get()
  @ApiOperation({ summary: 'Health check, returns ok' })
  @ApiResponse({ status: 200, description: 'Returns status: ok' })
  getStatus() {
    return { status: 'ok' };
  }
}
