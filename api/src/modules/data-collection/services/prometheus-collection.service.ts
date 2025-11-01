import { Injectable, Logger } from '@nestjs/common';
import {
  PrometheusClient,
  PrometheusResponse,
} from '../clients/prometheus.client';

export interface PrometheusQueryConfig {
  name: string;
  description: string;
  query: string;
}

export interface PrometheusCollectionData {
  timestamp: string;
  [queryName: string]: PrometheusResponse | string;
}

@Injectable()
export class PrometheusCollectionService {
  private readonly logger = new Logger(PrometheusCollectionService.name);

  private prometheusData: PrometheusCollectionData = {
    timestamp: new Date().toISOString(),
  };

  // Define the queries (PROD data only)
  private readonly queries: PrometheusQueryConfig[] = [
    {
      name: 'CPU Info',
      description: 'CPU count by hostname, model, cores, threads',
      query: 'count by (hostname, model, cores, threads) (cpumon_cpu_info)',
    },
    {
      name: 'Memory Total',
      description: 'Total memory in bytes per node',
      query: 'node_memory_MemTotal_bytes',
    },
    {
      name: 'GPU Device State',
      description: 'GPU device state codes',
      query: 'gpumon_device_state_code',
    },
    {
      name: 'Disk Info',
      description: 'SMART device information',
      query: 'smartmon_device_info',
    },
    {
      name: 'Network Info',
      description: 'Network interface count by hostname, speed, driver',
      query: 'count by (hostname, speed_mbps, driver) (nicmon_info)',
    },
    {
      name: 'Node Owners',
      description: 'Node ownership information',
      query: 'count by (node, label_owner) (kube_node_labels{label_owner!=""})',
    },
    {
      name: 'VM Count',
      description: 'Number of VMs per hypervisor',
      query: 'count by(hostname)(libvirtd_domain_domain_state)',
    },
  ];

  constructor(private readonly prometheusClient: PrometheusClient) {}

  async collect(): Promise<void> {
    this.logger.log('Collecting data from PROMETHEUS...');

    const collectedData: Record<string, PrometheusResponse> = {};

    for (const queryConfig of this.queries) {
      try {
        this.logger.debug(`Querying: ${queryConfig.name}`);
        const result = await this.prometheusClient.query(queryConfig.query);
        collectedData[queryConfig.name] = result;
        this.logger.debug(`Successfully collected: ${queryConfig.name}`);
      } catch (error) {
        this.logger.warn(
          `Failed to collect data for "${queryConfig.name}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.prometheusData = {
      timestamp: new Date().toISOString(),
      ...collectedData,
    } as PrometheusCollectionData;

    this.logger.log(
      `PROMETHEUS data collected - ${Object.keys(collectedData).length}/${this.queries.length} queries successful`,
    );
  }

  getData(): PrometheusCollectionData {
    return this.prometheusData;
  }

  getQueries(): PrometheusQueryConfig[] {
    return this.queries;
  }
}
