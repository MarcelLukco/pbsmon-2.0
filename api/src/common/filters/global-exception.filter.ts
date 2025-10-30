import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError } from '../dto/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Support HttpException (with status) or default to 500
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception && exception.message
        ? exception.message
        : 'Internal server error';
    let details =
      exception && exception.response ? exception.response : undefined;

    // Hide stack in production, but add for debugging
    if (process.env.NODE_ENV !== 'production' && exception.stack) {
      details = { ...details, stack: exception.stack };
    }

    response.status(status).json(new ApiError(message, details));
  }
}
