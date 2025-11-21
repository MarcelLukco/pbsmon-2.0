import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PbsConfig } from '@/config/pbs.config';
import {
  PbsData,
  PbsServerData,
  PbsCollection,
  PbsEntity,
  PbsJob,
  PbsQueue,
  PbsNode,
  PbsServer,
  PbsResource,
  PbsReservation,
  PbsScheduler,
  PbsHook,
} from '../types/pbs.types';

@Injectable()
export class PbsCollectionService {
  private readonly logger = new Logger(PbsCollectionService.name);
  private readonly config: PbsConfig;

  private pbsData: PbsData | null = null;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<PbsConfig>('pbs')!;

    this.logger.log(
      `PBS data path configured: ${this.config.dataPath} (set PBS_DATA_PATH env var to override)`,
    );
  }

  async collect(): Promise<void> {
    this.logger.log('Collecting data from PBS filesystem...');
    try {
      const serversData: Record<string, PbsServerData> = {};
      const basePath = this.config.dataPath;

      // Scan for server subdirectories
      const entries = await fs.readdir(basePath, { withFileTypes: true });
      const serverDirs = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      if (serverDirs.length === 0) {
        this.logger.warn(
          `No server directories found in ${basePath}. Expected subdirectories like 'pbs-m1', 'pbs-m2', etc.`,
        );
        this.pbsData = {
          timestamp: new Date().toISOString(),
          servers: {},
        };
        return;
      }

      // Collect data for each server
      for (const serverDir of serverDirs) {
        const serverPath = path.join(basePath, serverDir);
        this.logger.debug(`Collecting data for server: ${serverDir}`);

        // Load all PBS entity files for this server
        const jobs = await this.loadEntityFile<PbsJob>(
          path.join(serverPath, 'jobs.json'),
          'jobs',
        );
        const queues = await this.loadEntityFile<PbsQueue>(
          path.join(serverPath, 'queues.json'),
          'queues',
        );
        const nodes = await this.loadEntityFile<PbsNode>(
          path.join(serverPath, 'nodes.json'),
          'nodes',
        );
        const servers = await this.loadEntityFile<PbsServer>(
          path.join(serverPath, 'servers.json'),
          'servers',
        );
        const resources = await this.loadEntityFile<PbsResource>(
          path.join(serverPath, 'resources.json'),
          'resources',
        );
        const reservations = await this.loadEntityFile<PbsReservation>(
          path.join(serverPath, 'reservations.json'),
          'reservations',
        );
        const schedulers = await this.loadEntityFile<PbsScheduler>(
          path.join(serverPath, 'schedulers.json'),
          'schedulers',
        );
        const hooks = await this.loadEntityFile<PbsHook>(
          path.join(serverPath, 'hooks.json'),
          'hooks',
        );

        // Determine server name from servers collection or use directory name
        let serverName = serverDir;
        if (servers?.items && servers.items.length > 0) {
          // Extract server name from first server's name (e.g., "pbs-m1.metacentrum.cz" -> "pbs-m1")
          const fullServerName = servers.items[0].name;
          serverName = fullServerName.split('.')[0] || serverDir;
        }

        serversData[serverName] = {
          timestamp: new Date().toISOString(),
          serverName,
          jobs,
          queues,
          nodes,
          servers,
          resources,
          reservations,
          schedulers,
          hooks,
        };

        const loadedEntities = [
          jobs && 'Jobs',
          queues && 'Queues',
          nodes && 'Nodes',
          servers && 'Servers',
          resources && 'Resources',
          reservations && 'Reservations',
          schedulers && 'Schedulers',
          hooks && 'Hooks',
        ]
          .filter(Boolean)
          .join(', ');

        this.logger.log(
          `PBS data collected for ${serverName} - Loaded: ${loadedEntities}`,
        );
      }

      this.pbsData = {
        timestamp: new Date().toISOString(),
        servers: serversData,
      };

      this.logger.log(
        `PBS data collection completed for ${Object.keys(serversData).length} server(s): ${Object.keys(serversData).join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `Error collecting PBS data: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async loadEntityFile<T extends PbsEntity>(
    filePath: string,
    entityType: string,
  ): Promise<PbsCollection<T> | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data: PbsCollection<T> = JSON.parse(content);
      this.logger.debug(
        `Loaded ${entityType} data from ${filePath} (${data.count} items)`,
      );
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('ENOENT')) {
        this.logger.warn(
          `PBS ${entityType} file not found: ${filePath}. Skipping ${entityType}.`,
        );
      } else {
        this.logger.warn(`Failed to load ${entityType} file: ${errorMessage}`);
      }
      return null;
    }
  }

  getData(): PbsData | null {
    return this.pbsData;
  }
}
