// Standard DTOs for API responses
//
// Usage Example for error:
//   return new ApiError('Not found', { requestedId: id });
//
// Usage Example for success:
//   return new ApiResponse(dataEntity, metaInfo);
import { MetaDto } from './meta.dto';

export class ApiResponse<T = any, M = MetaDto> {
  data: T;
  meta?: M;
  constructor(data: T, meta?: M) {
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }
}

export class ApiError {
  error: string;
  details?: any;
  constructor(error: string, details?: any) {
    this.error = error;
    if (details) {
      this.details = details;
    }
  }
}
