import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataCollectionService } from './data-collection.service';

@ApiTags('data-collection')
@Controller('data-collection')
export class DataCollectionController {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  @Get('perun')
  @ApiOperation({ summary: 'Get PERUN data from memory' })
  @ApiResponse({
    status: 200,
    description: 'Returns PERUN data stored in memory',
  })
  getPerunData() {
    return this.dataCollectionService.getPerunData();
  }

  @Post('perun')
  @ApiOperation({ summary: 'Manually trigger PERUN data collection' })
  @ApiResponse({
    status: 200,
    description: 'Data collection triggered successfully',
  })
  async collectPerun() {
    await this.dataCollectionService.collectPerun();
    return { message: 'ok' };
  }

  @Post('prometheus')
  @ApiOperation({ summary: 'Manually trigger PROMETHEUS data collection' })
  @ApiResponse({
    status: 200,
    description: 'Data collection triggered successfully',
  })
  async collectPrometheus() {
    await this.dataCollectionService.collectPrometheus();
    return { message: 'ok' };
  }

  @Get('pbs')
  @ApiOperation({ summary: 'Get PBS data from memory' })
  @ApiResponse({
    status: 200,
    description: 'Returns PBS data stored in memory',
  })
  getPbsData() {
    return this.dataCollectionService.getPbsData();
  }

  @Post('pbs')
  @ApiOperation({ summary: 'Manually trigger PBS data collection' })
  @ApiResponse({
    status: 200,
    description: 'Data collection triggered successfully',
  })
  async collectPbs() {
    await this.dataCollectionService.collectPbs();
    return { message: 'ok' };
  }
}
