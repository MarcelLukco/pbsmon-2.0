import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PbsConfig } from '@/config/pbs.config';
import {
  PbsData,
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
      // Load all PBS entity files
      const jobs = await this.loadEntityFile<PbsJob>('jobs.json', 'jobs');
      const queues = await this.loadEntityFile<PbsQueue>(
        'queues.json',
        'queues',
      );
      const nodes = await this.loadEntityFile<PbsNode>('nodes.json', 'nodes');
      const servers = await this.loadEntityFile<PbsServer>(
        'servers.json',
        'servers',
      );
      const resources = await this.loadEntityFile<PbsResource>(
        'resources.json',
        'resources',
      );
      const reservations = await this.loadEntityFile<PbsReservation>(
        'reservations.json',
        'reservations',
      );
      const schedulers = await this.loadEntityFile<PbsScheduler>(
        'schedulers.json',
        'schedulers',
      );
      const hooks = await this.loadEntityFile<PbsHook>('hooks.json', 'hooks');

      this.pbsData = {
        timestamp: new Date().toISOString(),
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

      this.logger.log(`PBS data collected - Loaded: ${loadedEntities}`);
    } catch (error) {
      this.logger.error(
        `Error collecting PBS data: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async loadEntityFile<T extends PbsEntity>(
    filename: string,
    entityType: string,
  ): Promise<PbsCollection<T> | null> {
    const filePath = path.join(this.config.dataPath, filename);
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
