import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse as ApiResponseDto } from '@/common/dto/api-response.dto';
import { UserContextDecorator } from '@/common/decorators/user-context.decorator';
import { UserContext } from '@/common/types/user-context.types';
import { AccountingService } from './accounting.service';
import { UserInfoDTO } from './dto/user-info.dto';
import { OutageRecordDTO } from './dto/outage-record.dto';
import { CanonicalOrgNameDTO } from './dto/org-name.dto';
import {
  ApiOkResponseModel,
  ApiOkResponseArray,
} from '@/common/swagger/api-generic-response';

@ApiTags('accounting')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('users/:username')
  @ApiOperation({
    summary: 'Get user accounting information',
    description:
      'Returns user accounting information including job count, total CPU time, and yearly usage breakdown. Admin can see all users. Non-admin can see themselves and users from their groups (excluding system-wide groups that contain 80%+ of all Metacentrum users). Returns null if database is not configured.',
  })
  @ApiOkResponseModel(UserInfoDTO, 'User accounting information')
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserInfo(
    @Param('username') username: string,
    @UserContextDecorator() userContext: UserContext,
  ): Promise<ApiResponseDto<UserInfoDTO | null>> {
    try {
      const data = await this.accountingService.getUserInfoByName(
        username,
        userContext,
      );
      return new ApiResponseDto(data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`User '${username}' was not found`);
    }
  }

  @Get('nodes/:nodeName/outages')
  @ApiOperation({
    summary: 'Get outages for a node',
    description:
      'Returns list of outages for a specific node. Returns empty array if database is not configured.',
  })
  @ApiOkResponseArray(OutageRecordDTO, 'List of outages')
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
  @ApiOkResponseArray(String, 'List of started job IDs')
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
  @ApiOkResponseArray(CanonicalOrgNameDTO, 'List of organization names')
  async getCanonicalOrgNames(): Promise<ApiResponseDto<CanonicalOrgNameDTO[]>> {
    const data = await this.accountingService.getCanonicalOrgNames();
    return new ApiResponseDto(data);
  }
}
