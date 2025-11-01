import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PerunConfig } from '@/config/perun.config';
import {
  PerunData,
  PerunMachines,
  PerunUsers,
  EtcGroupEntry,
  PerunEtcGroups,
} from '../types/perun.types';

@Injectable()
export class PerunCollectionService {
  private readonly logger = new Logger(PerunCollectionService.name);
  private readonly config: PerunConfig;

  private perunData: PerunData | null = null;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<PerunConfig>('perun')!;

    this.logger.log(
      `PERUN data path configured: ${this.config.dataPath} (set PERUN_DATA_PATH env var to override)`,
    );
  }

  async collect(): Promise<void> {
    this.logger.log('Collecting data from PERUN filesystem...');
    try {
      // Load machines JSON file
      const machinesPath = path.join(
        this.config.dataPath,
        'pbsmon_machines.json',
      );
      let machines: PerunMachines | null = null;
      try {
        const machinesContent = await fs.readFile(machinesPath, 'utf-8');
        machines = JSON.parse(machinesContent) as PerunMachines;
        this.logger.debug(`Loaded machines data from ${machinesPath}`);
      } catch (error) {
        this.logger.warn(
          `Failed to load machines file: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Load users JSON file
      const usersPath = path.join(this.config.dataPath, 'pbsmon_users.json');
      let users: PerunUsers | null = null;
      try {
        const usersContent = await fs.readFile(usersPath, 'utf-8');
        users = JSON.parse(usersContent) as PerunUsers;
        this.logger.debug(`Loaded users data from ${usersPath}`);
      } catch (error) {
        this.logger.warn(
          `Failed to load users file: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Load all etc_group files
      const etcGroups: PerunEtcGroups = [];
      try {
        const etcGroupsPath = path.join(this.config.dataPath, 'etc_groups');
        const files = await fs.readdir(etcGroupsPath);
        const etcGroupFiles = files.filter((file) =>
          file.startsWith('etc_group_'),
        );

        for (const file of etcGroupFiles) {
          const serverName = file.replace('etc_group_', '');
          const filePath = path.join(etcGroupsPath, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const entries = this.parseEtcGroup(content);
            etcGroups.push({
              serverName,
              entries,
            });
            this.logger.debug(
              `Loaded etc_group file for server: ${serverName} (${entries.length} groups)`,
            );
          } catch (error) {
            this.logger.warn(
              `Failed to load etc_group file ${file}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('ENOENT')) {
          this.logger.warn(
            `PERUN data directory not found: ${this.config.dataPath}. Please ensure the directory exists or set PERUN_DATA_PATH environment variable.`,
          );
        } else {
          this.logger.warn(`Failed to read directory: ${errorMessage}`);
        }
      }

      this.perunData = {
        timestamp: new Date().toISOString(),
        machines,
        users,
        etcGroups,
      };

      this.logger.log(
        `PERUN data collected - Machines: ${machines ? '✓' : '✗'}, Users: ${users ? '✓' : '✗'}, Etc Groups: ${etcGroups.length} servers`,
      );
    } catch (error) {
      this.logger.error(
        `Error collecting PERUN data: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  getData(): PerunData | null {
    return this.perunData;
  }

  private parseEtcGroup(content: string): EtcGroupEntry[] {
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    const entries: EtcGroupEntry[] = [];

    for (const line of lines) {
      // Skip comments
      if (line.startsWith('#')) {
        continue;
      }

      const parts = line.split(':');
      if (parts.length >= 3) {
        const entry: EtcGroupEntry = {
          groupname: parts[0] || '',
          password: parts[1] || '',
          gid: parts[2] || '',
          members: parts[3]
            ? parts[3].split(',').filter((m) => m.trim() !== '')
            : [],
        };
        entries.push(entry);
      }
    }

    return entries;
  }
}
