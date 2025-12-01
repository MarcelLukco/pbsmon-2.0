#!/usr/bin/env ts-node

import { Command } from 'commander';
import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

if (!process.env.PROMETHEUS_BASE_URL) {
  throw new Error('PROMETHEUS_BASE_URL is not set in .env file');
}
if (!process.env.PROMETHEUS_API_ENDPOINT) {
  throw new Error('PROMETHEUS_API_ENDPOINT is not set in .env file');
}
if (!process.env.PROMETHEUS_USERNAME) {
  throw new Error('PROMETHEUS_USERNAME is not set in .env file');
}
if (!process.env.PROMETHEUS_PASSWORD) {
  throw new Error('PROMETHEUS_PASSWORD is not set in .env file');
}

interface PrometheusResponse {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value: [number, string];
    }>;
  };
}

interface QueryConfig {
  name: string;
  description: string;
  query: string;
  outputFile?: string;
}

class PrometheusClient {
  private baseUrl: string;
  private apiEndpoint: string;
  private rangeHours: number;

  constructor() {
    this.baseUrl = process.env.PROMETHEUS_BASE_URL!;
    this.apiEndpoint = process.env.PROMETHEUS_API_ENDPOINT!;
    this.rangeHours = parseInt(process.env.QUERY_RANGE_HOURS || '1');
  }

  async queryPrometheus(query: string): Promise<PrometheusResponse> {
    const url = `${this.baseUrl}${this.apiEndpoint}`;
    const endTime = Math.floor(Date.now() / 1000);

    try {
      // For /api/v1/query (instant query), we only need query and time parameters
      // start, end, and step are for /api/v1/query_range (range query)
      const params: Record<string, string> = {
        query: query,
        time: endTime.toString(),
      };

      const response = await axios.get(url, {
        params,
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.PROMETHEUS_TOKEN && {
            Authorization: `Bearer ${process.env.PROMETHEUS_TOKEN}`,
          }),
        },
        auth: {
          username: process.env.PROMETHEUS_USERNAME!,
          password: process.env.PROMETHEUS_PASSWORD!,
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
      console.error('Error querying Prometheus:', errorMessage);
      throw error;
    }
  }

  formatResult(result: PrometheusResponse, queryName: string): string {
    let output = `\n=== ${queryName} ===\n`;
    output += `Status: ${result.status}\n`;
    output += `Result Type: ${result.data.resultType}\n`;
    output += `Number of results: ${result.data.result.length}\n\n`;

    if (result.data.result.length === 0) {
      output += 'No data found for this query.\n';
      return output;
    }

    result.data.result.forEach((item, index) => {
      output += `Result ${index + 1}:\n`;
      output += `  Value: ${item.value[1]}\n`;
      output += `  Timestamp: ${new Date(Number(item.value[0]) * 1000).toISOString()}\n`;
      output += `  Labels:\n`;
      Object.entries(item.metric).forEach(([key, value]) => {
        output += `    ${key}: ${value}\n`;
      });
      output += '\n';
    });

    return output;
  }

  async saveToFile(data: string, filename: string): Promise<void> {
    const outputDir = path.join(process.cwd(), 'data', 'prometheus');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, data);
    console.log(`Results saved to: ${filePath}`);
  }
}

// Define the queries based on the provided URLs (PROD data only)
const queries: QueryConfig[] = [
  {
    name: 'CPU Info',
    description: 'CPU count by hostname, model, cores, threads',
    query: 'count by (hostname, model, cores, threads) (cpumon_cpu_info)',
    outputFile: 'cpu_info.json',
  },
  {
    name: 'Memory Total',
    description: 'Total memory in bytes per node',
    query: 'node_memory_MemTotal_bytes',
    outputFile: 'memory_total.json',
  },
  {
    name: 'GPU Device State',
    description: 'GPU device state codes',
    query: 'gpumon_device_state_code',
    outputFile: 'gpu_state.json',
  },
  {
    name: 'Disk Info',
    description: 'SMART device information',
    query: 'smartmon_device_info',
    outputFile: 'disk_info.json',
  },
  {
    name: 'Network Info',
    description: 'Network interface count by hostname, speed, driver',
    query: 'count by (hostname, speed_mbps, driver) (nicmon_info)',
    outputFile: 'network_info.json',
  },
  {
    name: 'Node Owners',
    description: 'Node ownership information',
    query: 'count by (node, label_owner) (kube_node_labels{label_owner!=""})',
    outputFile: 'node_owners.json',
  },
  {
    name: 'VM Count',
    description: 'Number of VMs per hypervisor',
    query: 'count by(hostname)(libvirtd_domain_domain_state)',
    outputFile: 'vm_count.json',
  },
  {
    name: 'OpenStack Projects',
    description: 'List of OpenStack projects (id + name)',
    query: 'openstack_identity_project_info',
    outputFile: 'openstack_projects.json',
  },
  {
    name: 'OpenStack Users',
    description: 'List of OpenStack users (id + name)',
    query: 'openstack_identity_user_info',
    outputFile: 'openstack_users.json',
  },
  {
    name: 'OpenStack Servers',
    description: 'List of OpenStack servers/VMs (id, name, project_id)',
    query: 'custom_openstack_server_info',
    outputFile: 'openstack_servers.json',
  },
  {
    name: 'VM VCPU Count',
    description: 'VCPU count per VM (by uuid)',
    query: 'count by (uuid) (libvirtd_domain_vcpu_time)',
    outputFile: 'vm_vcpu_count.json',
  },
  {
    name: 'VM Memory Allocation',
    description: 'Memory allocation per VM in GB (balloon_current)',
    query: '(libvirtd_domain_balloon_current * 1024) / (1024 * 1024 * 1024)',
    outputFile: 'vm_memory_allocation.json',
  },
  {
    name: 'VM CPU Utilization',
    description: 'Current CPU utilization per VM (rate of vcpu_time)',
    query: 'sum by (uuid) (rate(libvirtd_domain_vcpu_time[1h])) / 1e9',
    outputFile: 'vm_cpu_utilization.json',
  },
  {
    name: 'VM Memory Usage',
    description: 'Memory usage per VM in GB (current - available)',
    query:
      '(libvirtd_domain_balloon_current - libvirtd_domain_balloon_available) / (1024*1024)',
    outputFile: 'vm_memory_usage.json',
  },
  {
    name: 'VM Domain State',
    description: 'VM domain state information (includes hypervisor info)',
    query: 'libvirtd_domain_domain_state',
    outputFile: 'vm_domain_state.json',
  },
];

async function main() {
  const program = new Command();
  const client = new PrometheusClient();

  program
    .name('prometheus-cli')
    .description('CLI tool to query Prometheus for PBS monitoring data')
    .version('1.0.0');

  program
    .command('list')
    .description('List all available queries')
    .action(() => {
      console.log('\nAvailable queries:\n');
      queries.forEach((query, index) => {
        console.log(`${index + 1}. ${query.name}`);
        console.log(`   Description: ${query.description}`);
        console.log(`   Query: ${query.query}`);
        console.log(`   Output file: ${query.outputFile}\n`);
      });
    });

  program
    .command('query <queryName>')
    .description('Execute a specific query by name')
    .option('-o, --output <file>', 'Output file path')
    .option('--no-save', 'Do not save results to file')
    .action(async (queryName: string, options) => {
      const query = queries.find(
        (q) => q.name.toLowerCase() === queryName.toLowerCase(),
      );
      if (!query) {
        console.error(
          `Query "${queryName}" not found. Use "list" to see available queries.`,
        );
        process.exit(1);
      }

      try {
        console.log(`Executing query: ${query.name}`);
        console.log(`Query: ${query.query}\n`);

        const result = await client.queryPrometheus(query.query);
        const formattedResult = client.formatResult(result, query.name);

        console.log(formattedResult);

        if (options.save !== false) {
          const outputFile =
            options.output ||
            query.outputFile ||
            `${query.name.toLowerCase().replace(/\s+/g, '_')}.json`;
          await client.saveToFile(JSON.stringify(result, null, 2), outputFile);
        }
      } catch (error) {
        console.error(`Error executing query: ${error}`);
        process.exit(1);
      }
    });

  program
    .command('run-all')
    .description('Execute all queries')
    .option('--no-save', 'Do not save results to files')
    .action(async (options) => {
      console.log('Executing all queries...\n');

      for (const query of queries) {
        try {
          console.log(`\n${'='.repeat(50)}`);
          console.log(`Executing: ${query.name}`);
          console.log(`${'='.repeat(50)}`);

          const result = await client.queryPrometheus(query.query);
          const formattedResult = client.formatResult(result, query.name);

          console.log(formattedResult);

          if (options.save !== false) {
            await client.saveToFile(
              JSON.stringify(result, null, 2),
              query.outputFile!,
            );
          }
        } catch (error) {
          console.error(`Error executing query "${query.name}": ${error}`);
        }
      }
    });

  program
    .command('custom <query>')
    .description('Execute a custom PromQL query')
    .option('-o, --output <file>', 'Output file path')
    .option('--no-save', 'Do not save results to file')
    .action(async (query: string, options) => {
      try {
        console.log(`Executing custom query: ${query}\n`);

        const result = await client.queryPrometheus(query);
        const formattedResult = client.formatResult(result, 'Custom Query');

        console.log(formattedResult);

        if (options.save !== false) {
          const outputFile = options.output || 'custom_query.json';
          await client.saveToFile(JSON.stringify(result, null, 2), outputFile);
        }
      } catch (error) {
        console.error(`Error executing custom query: ${error}`);
        process.exit(1);
      }
    });

  program
    .command('project-personal <oidcSub>')
    .description(
      'Query personal project by OIDC sub (e.g., user@einfra.cesnet.cz)',
    )
    .option('-o, --output <file>', 'Output file path')
    .option('--no-save', 'Do not save results to file')
    .action(async (oidcSub: string, options) => {
      try {
        // Personal project query: openstack_identity_project_info{description=~".*oidcSub.*"}
        const query = `openstack_identity_project_info{description=~".*${oidcSub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*"}`;
        console.log(`Querying personal project for OIDC sub: ${oidcSub}\n`);
        console.log(`Query: ${query}\n`);

        const result = await client.queryPrometheus(query);
        const formattedResult = client.formatResult(result, 'Personal Project');

        console.log(formattedResult);

        if (options.save !== false) {
          const outputFile =
            options.output ||
            `project_personal_${oidcSub.replace(/[@.]/g, '_')}.json`;
          await client.saveToFile(JSON.stringify(result, null, 2), outputFile);
        }
      } catch (error) {
        console.error(`Error querying personal project: ${error}`);
        process.exit(1);
      }
    });

  program
    .command('project-by-name <projectName>')
    .description('Query project by name')
    .option('-o, --output <file>', 'Output file path')
    .option('--no-save', 'Do not save results to file')
    .action(async (projectName: string, options) => {
      try {
        const query = `openstack_identity_project_info{name="${projectName}"}`;
        console.log(`Querying project by name: ${projectName}\n`);
        console.log(`Query: ${query}\n`);

        const result = await client.queryPrometheus(query);
        const formattedResult = client.formatResult(result, 'Project by Name');

        console.log(formattedResult);

        if (options.save !== false) {
          const outputFile =
            options.output ||
            `project_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
          await client.saveToFile(JSON.stringify(result, null, 2), outputFile);
        }
      } catch (error) {
        console.error(`Error querying project: ${error}`);
        process.exit(1);
      }
    });

  program
    .command('servers-by-project <projectId>')
    .description('Query VMs/servers by project ID')
    .option('-o, --output <file>', 'Output file path')
    .option('--no-save', 'Do not save results to file')
    .action(async (projectId: string, options) => {
      try {
        const query = `custom_openstack_server_info{project_id="${projectId}"}`;
        console.log(`Querying servers for project ID: ${projectId}\n`);
        console.log(`Query: ${query}\n`);

        const result = await client.queryPrometheus(query);
        const formattedResult = client.formatResult(
          result,
          'Servers by Project',
        );

        console.log(formattedResult);

        if (options.save !== false) {
          const outputFile =
            options.output || `servers_project_${projectId}.json`;
          await client.saveToFile(JSON.stringify(result, null, 2), outputFile);
        }
      } catch (error) {
        console.error(`Error querying servers: ${error}`);
        process.exit(1);
      }
    });

  program
    .command('vm-utilization <vmUuid>')
    .description('Query VM utilization (CPU and Memory) by UUID')
    .option('-o, --output <file>', 'Output file path')
    .option('--no-save', 'Do not save results to file')
    .action(async (vmUuid: string, options) => {
      try {
        console.log(`Querying VM utilization for UUID: ${vmUuid}\n`);

        // VCPU count
        const vcpuCountQuery = `count by (uuid) (libvirtd_domain_vcpu_time{uuid="${vmUuid}"})`;
        console.log(`Query 1 - VCPU Count: ${vcpuCountQuery}`);
        const vcpuCount = await client.queryPrometheus(vcpuCountQuery);

        // Memory allocation (GB)
        const memAllocQuery = `(libvirtd_domain_balloon_current{uuid="${vmUuid}"} * 1024) / (1024 * 1024 * 1024)`;
        console.log(`Query 2 - Memory Allocation: ${memAllocQuery}`);
        const memAlloc = await client.queryPrometheus(memAllocQuery);

        // CPU utilization (rate)
        const cpuUtilQuery = `sum by (uuid) (rate(libvirtd_domain_vcpu_time{uuid="${vmUuid}"}[1h])) / 1e9`;
        console.log(`Query 3 - CPU Utilization: ${cpuUtilQuery}`);
        const cpuUtil = await client.queryPrometheus(cpuUtilQuery);

        // Memory usage (GB)
        const memUsageQuery = `(libvirtd_domain_balloon_current{uuid="${vmUuid}"} - libvirtd_domain_balloon_available{uuid="${vmUuid}"}) / (1024*1024)`;
        console.log(`Query 4 - Memory Usage: ${memUsageQuery}`);
        const memUsage = await client.queryPrometheus(memUsageQuery);

        const combinedResult = {
          status: 'success',
          data: {
            vcpuCount: vcpuCount.data,
            memoryAllocation: memAlloc.data,
            cpuUtilization: cpuUtil.data,
            memoryUsage: memUsage.data,
          },
        };

        console.log('\n=== VM Utilization Summary ===\n');
        console.log(client.formatResult(vcpuCount, 'VCPU Count'));
        console.log(client.formatResult(memAlloc, 'Memory Allocation (GB)'));
        console.log(client.formatResult(cpuUtil, 'CPU Utilization'));
        console.log(client.formatResult(memUsage, 'Memory Usage (GB)'));

        if (options.save !== false) {
          const outputFile = options.output || `vm_utilization_${vmUuid}.json`;
          await client.saveToFile(
            JSON.stringify(combinedResult, null, 2),
            outputFile,
          );
        }
      } catch (error) {
        console.error(`Error querying VM utilization: ${error}`);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

if (require.main === module) {
  main().catch(console.error);
}
