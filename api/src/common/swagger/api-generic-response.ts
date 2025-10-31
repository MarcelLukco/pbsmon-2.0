import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { MetaDto } from '../dto/meta.dto';

// Describes: { data: T, meta?: MetaDto }
export function ApiOkResponseModel(
  model: any,
  description?: string,
  metaModel: any = MetaDto,
) {
  return applyDecorators(
    ApiExtraModels(model, metaModel),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        required: ['data'],
        properties: {
          data: { $ref: getSchemaPath(model) },
          meta: { $ref: getSchemaPath(metaModel) },
        },
      },
    }),
  );
}

// Describes: { data: T[], meta?: MetaDto }
export function ApiOkResponseArray(
  model: any,
  description?: string,
  metaModel: any = MetaDto,
) {
  return applyDecorators(
    ApiExtraModels(model, metaModel),
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        required: ['data'],
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(metaModel) },
        },
      },
    }),
  );
}

// Describes an error response: { error: string, details?: any }
export function ApiErrorResponse(status: number, description?: string) {
  return applyDecorators(
    SwaggerApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
          details: { type: 'object', nullable: true },
        },
      },
    }),
  );
}
