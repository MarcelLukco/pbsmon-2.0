import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class PrometheusConfig {
  @IsString()
  baseUrl: string;

  @IsString()
  apiEndpoint: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  queryRangeHours?: number;
}

export const getPrometheusConfig = (): PrometheusConfig => ({
  baseUrl: process.env.PROMETHEUS_BASE_URL || 'https://dummy',
  apiEndpoint: process.env.PROMETHEUS_API_ENDPOINT || '/api/v1/query',
  username: process.env.PROMETHEUS_USERNAME || '',
  password: process.env.PROMETHEUS_PASSWORD || '',
  token: process.env.PROMETHEUS_TOKEN,
  queryRangeHours: parseInt(process.env.QUERY_RANGE_HOURS || '1', 10),
});
