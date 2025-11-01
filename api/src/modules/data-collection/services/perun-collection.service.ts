import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EtcGroupEntry {
  groupname: string;
  password: string;
  gid: string;
  members: string[];
}

export interface PerunData {
  timestamp: string;
  machines: any;
  users: any;
  etcGroups: Record<string, EtcGroupEntry[]>;
}

@Injectable()
export class PerunCollectionService {
  private readonly logger = new Logger(PerunCollectionService.name);
  private readonly PERUN_DATA_PATH =
    process.env.PERUN_DATA_PATH || 'data/perun';

  private perunData: PerunData | null = null;

  constructor() {
    this.logger.log(
      `PERUN data path configured: ${this.PERUN_DATA_PATH} (set PERUN_DATA_PATH env var to override)`,
    );
  }

  async collect(): Promise<void> {
    this.logger.log('Collecting data from PERUN filesystem...');
    try {
      // Load machines JSON file
      const machinesPath = path.join(
        this.PERUN_DATA_PATH,
        'pbsmon_machines.json',
      );
      let machines = null;
      try {
        const machinesContent = await fs.readFile(machinesPath, 'utf-8');
        machines = JSON.parse(machinesContent);
        this.logger.debug(`Loaded machines data from ${machinesPath}`);
      } catch (error) {
        this.logger.warn(
          `Failed to load machines file: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Load users JSON file
      const usersPath = path.join(this.PERUN_DATA_PATH, 'pbsmon_users.json');
      let users = null;
      try {
        const usersContent = await fs.readFile(usersPath, 'utf-8');
        users = JSON.parse(usersContent);
        this.logger.debug(`Loaded users data from ${usersPath}`);
      } catch (error) {
        this.logger.warn(
          `Failed to load users file: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      // Load all etc_group files
      const etcGroups: Record<string, EtcGroupEntry[]> = {};
      try {
        const etcGroupsPath = path.join(this.PERUN_DATA_PATH, 'etc_groups');
        const files = await fs.readdir(etcGroupsPath);
        const etcGroupFiles = files.filter((file) =>
          file.startsWith('etc_group_'),
        );

        for (const file of etcGroupFiles) {
          const serverName = file.replace('etc_group_', '');
          const filePath = path.join(etcGroupsPath, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            etcGroups[serverName] = this.parseEtcGroup(content);
            this.logger.debug(
              `Loaded etc_group file for server: ${serverName} (${etcGroups[serverName].length} groups)`,
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
            `PERUN data directory not found: ${this.PERUN_DATA_PATH}. Please ensure the directory exists or set PERUN_DATA_PATH environment variable.`,
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
        `PERUN data collected - Machines: ${machines ? '✓' : '✗'}, Users: ${users ? '✓' : '✗'}, Etc Groups: ${Object.keys(etcGroups).length} servers`,
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
