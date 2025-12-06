import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseDecorator,
} from '@nestjs/swagger';
import { ApiResponse } from '@/common/dto/api-response.dto';
import { UserContextDecorator } from '@/common/decorators/user-context.decorator';
import { UserContext } from '@/common/types/user-context.types';
import { QsubService } from './qsub.service';
import { QsubConfigResponseDto } from './dto/qsub-config.dto';
import {
  QsubPreviewRequestDto,
  QsubPreviewResponseDto,
} from './dto/qsub-preview.dto';

@ApiTags('qsub')
@Controller('qsub')
export class QsubController {
  constructor(private readonly qsubService: QsubService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get QSUB form configuration' })
  @ApiResponseDecorator({
    status: 200,
    description: 'QSUB form configuration',
    type: QsubConfigResponseDto,
  })
  getConfig(
    @UserContextDecorator() userContext: UserContext,
  ): ApiResponse<QsubConfigResponseDto> {
    const config = this.qsubService.getConfig(userContext);
    return new ApiResponse(config);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Get QSUB command preview and qualified nodes' })
  @ApiResponseDecorator({
    status: 200,
    description: 'QSUB command and qualified nodes',
    type: QsubPreviewResponseDto,
  })
  async getPreview(
    @Body() request: QsubPreviewRequestDto,
  ): Promise<ApiResponse<QsubPreviewResponseDto>> {
    const preview = await this.qsubService.getPreview(request);
    return new ApiResponse(preview);
  }
}
