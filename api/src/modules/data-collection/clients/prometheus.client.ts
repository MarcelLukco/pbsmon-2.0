import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { PrometheusConfig } from '@/config/prometheus.config';

export interface PrometheusResponse {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value: [number, string];
    }>;
  };
}

/**
 * Prometheus API client for querying metrics.
 * This is an infrastructure layer client, not a business service.
 */
@Injectable()
export class PrometheusClient {
  private readonly logger = new Logger(PrometheusClient.name);
  private readonly config: PrometheusConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<PrometheusConfig>('prometheus')!;

    if (!this.config.username || !this.config.password) {
      this.logger.error('Prometheus credentials not configured');
    }

    this.logger.log(
      `Prometheus client configured: ${this.config.baseUrl}${this.config.apiEndpoint}`,
    );
  }

  async query(query: string): Promise<PrometheusResponse> {
    const url = `${this.config.baseUrl}${this.config.apiEndpoint}`;
    const endTime = Math.floor(Date.now() / 1000);
    const rangeHours = this.config.queryRangeHours || 1;
    const startTime = endTime - rangeHours * 3600;

    try {
      const response = await axios.get(url, {
        params: {
          query: query,
          time: endTime.toString(),
          start: startTime.toString(),
          end: endTime.toString(),
          step: '60s',
        },
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.token && {
            Authorization: `Bearer ${this.config.token}`,
          }),
        },
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      });

      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : String(error);
      this.logger.error(`Error querying Prometheus: ${errorMessage}`);
      throw new Error(`Failed to query Prometheus: ${errorMessage}`);
    }
  }

  /**
   * Execute an instant query (single point in time)
   * Uses /api/v1/query endpoint with only query and time parameters
   */
  async queryInstant(query: string): Promise<PrometheusResponse> {
    const url = `${this.config.baseUrl}${this.config.apiEndpoint}`;
    const endTime = Math.floor(Date.now() / 1000);

    try {
      const response = await axios.get(url, {
        params: {
          query: query,
          time: endTime.toString(),
        },
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.token && {
            Authorization: `Bearer ${this.config.token}`,
          }),
        },
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      });

      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : error instanceof Error
            ? error.message
            : String(error);
      this.logger.error(`Error querying Prometheus (instant): ${errorMessage}`);
      throw new Error(`Failed to query Prometheus: ${errorMessage}`);
    }
  }
}
