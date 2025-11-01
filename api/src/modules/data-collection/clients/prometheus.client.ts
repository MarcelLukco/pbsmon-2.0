import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

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
  private readonly baseUrl: string;
  private readonly apiEndpoint: string;
  private readonly rangeHours: number;

  constructor() {
    this.baseUrl =
      process.env.PROMETHEUS_BASE_URL ||
      'https://prometheus.brno.openstack.cloud.e-infra.cz';
    this.apiEndpoint = process.env.PROMETHEUS_API_ENDPOINT || '/api/v1/query';
    this.rangeHours = parseInt(process.env.QUERY_RANGE_HOURS || '1');

    this.logger.log(
      `Prometheus client configured: ${this.baseUrl}${this.apiEndpoint}`,
    );
  }

  async query(query: string): Promise<PrometheusResponse> {
    const url = `${this.baseUrl}${this.apiEndpoint}`;
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - this.rangeHours * 3600;

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
          ...(process.env.PROMETHEUS_TOKEN && {
            Authorization: `Bearer ${process.env.PROMETHEUS_TOKEN}`,
          }),
        },
        auth:
          process.env.PROMETHEUS_USERNAME && process.env.PROMETHEUS_PASSWORD
            ? {
                username: process.env.PROMETHEUS_USERNAME,
                password: process.env.PROMETHEUS_PASSWORD,
              }
            : undefined,
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
}
