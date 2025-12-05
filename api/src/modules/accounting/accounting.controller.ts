import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse as ApiResponseDto } from '@/common/dto/api-response.dto';
import { AccountingService } from './accounting.service';
import { UserInfoDTO } from './dto/user-info.dto';
import { OutageRecordDTO } from './dto/outage-record.dto';
import { CanonicalOrgNameDTO } from './dto/org-name.dto';
import { ApiOkResponseModel } from '@/common/swagger/api-generic-response';

@ApiTags('accounting')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('users/:username')
  @ApiOperation({
    summary: 'Get user accounting information',
    description:
      'Returns user accounting information including job count, total CPU time, and yearly usage breakdown. Returns null if database is not configured.',
  })
  @ApiOkResponseModel(UserInfoDTO, 'User accounting information')
  async getUserInfo(
    @Param('username') username: string,
  ): Promise<ApiResponseDto<UserInfoDTO | null>> {
    const data = await this.accountingService.getUserInfoByName(username);
    return new ApiResponseDto(data);
  }

  @Get('nodes/:nodeName/outages')
  @ApiOperation({
    summary: 'Get outages for a node',
    description:
      'Returns list of outages for a specific node. Returns empty array if database is not configured.',
  })
  @ApiOkResponseModel([OutageRecordDTO], 'List of outages')
  async getOutagesForNode(
    @Param('nodeName') nodeName: string,
  ): Promise<ApiResponseDto<OutageRecordDTO[]>> {
    const data = await this.accountingService.getOutagesForNode(nodeName);
    return new ApiResponseDto(data);
  }

  @Get('jobs/started')
  @ApiOperation({
    summary: 'Get list of started job IDs',
    description:
      'Returns list of started job IDs. Returns empty array if database is not configured.',
  })
  @ApiOkResponseModel([String], 'List of started job IDs')
  async getStartedJobIds(): Promise<ApiResponseDto<string[]>> {
    const data = await this.accountingService.getStartedJobIds();
    return new ApiResponseDto(data);
  }

  @Get('org-names')
  @ApiOperation({
    summary: 'Get canonical organization names',
    description:
      'Returns list of canonical organization names. Returns empty array if database is not configured.',
  })
  @ApiOkResponseModel([CanonicalOrgNameDTO], 'List of organization names')
  async getCanonicalOrgNames(): Promise<ApiResponseDto<CanonicalOrgNameDTO[]>> {
    const data = await this.accountingService.getCanonicalOrgNames();
    return new ApiResponseDto(data);
  }
}
