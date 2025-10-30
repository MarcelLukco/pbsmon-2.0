// Standard DTOs for API responses
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
