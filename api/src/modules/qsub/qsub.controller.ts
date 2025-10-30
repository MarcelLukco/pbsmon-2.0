import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@/common/dto/api-response.dto';

@Controller('qsub')
export class QsubController {
  @Get('dropdowns')
  getDropdownData(): ApiResponse<any[]> {
    return new ApiResponse([]);
  }

  @Get('machine-count')
  getMachineCount(): ApiResponse<any> {
    return new ApiResponse(null);
  }

  @Get('status')
  getStatus(): ApiResponse<any> {
    return new ApiResponse(null);
  }
}
