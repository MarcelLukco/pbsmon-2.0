// Standard DTOs for API responses
//
// Usage Example for error:
//   return new ApiError('Not found', { requestedId: id });
//
// Usage Example for success:
//   return new ApiResponse(dataEntity, metaInfo);
export class ApiResponse<T = any> {
  data: T;
  meta?: any;
  constructor(data: T, meta?: any) {
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
