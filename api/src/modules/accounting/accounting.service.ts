import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { AccountingConfig } from '@/config/accounting.config';
import { UserInfoDTO, UserUsageDTO } from './dto/user-info.dto';
import { OutageRecordDTO } from './dto/outage-record.dto';
import { CanonicalOrgNameDTO } from './dto/org-name.dto';

@Injectable()
export class AccountingService implements OnModuleDestroy {
  private readonly logger = new Logger(AccountingService.name);
  private pool: Pool | null = null;

  constructor(private readonly configService: ConfigService) {
    const accountingConfig =
      this.configService.get<AccountingConfig>('accounting');
    if (accountingConfig?.connectionString) {
      try {
        this.pool = new Pool({
          connectionString: accountingConfig.connectionString,
        });
        this.logger.log('Accounting database connection pool initialized');
      } catch (error) {
        this.logger.warn(
          'Failed to initialize accounting database connection pool',
          error,
        );
        this.pool = null;
      }
    } else {
      this.logger.warn(
        'ACCOUNTING_CONNECTION_STRING not set - accounting database features disabled',
      );
    }
  }

  /**
   * Check if database connection is available
   */
  private isDatabaseAvailable(): boolean {
    return this.pool !== null;
  }

  /**
   * Get user info by username
   * Returns null if database is not available
   */
  async getUserInfoByName(userName: string): Promise<UserInfoDTO | null> {
    if (!this.isDatabaseAvailable()) {
      this.logger.debug(
        `getUserInfoByName(${userName}) - database not available`,
      );
      return null;
    }

    this.logger.debug(`getUserInfoByName(${userName})`);

    try {
      // Get total job count and CPU time
      const userInfoQuery = `
        SELECT count(*), sum(used_walltime * used_ncpus)
        FROM acct_user u, acct_pbs_record p
        WHERE user_name = $1 AND u.acct_user_id = p.acct_user_id
      `;

      const userInfoResult = await this.pool!.query(userInfoQuery, [userName]);

      if (
        !userInfoResult.rows ||
        userInfoResult.rows.length === 0 ||
        !userInfoResult.rows[0]
      ) {
        return {
          jobCount: 0,
          totalCpuTime: 0,
          usages: [],
        };
      }

      const row = userInfoResult.rows[0];
      const jobCount = parseInt(row.count || '0', 10);
      const totalCpuTime = parseFloat(row.sum || '0');

      // Get yearly usage breakdown
      const usageQuery = `
        SELECT 
          count(*),
          sum((j.end_time - j.start_time) * j.used_ncpus) as cpu_time,
          extract(year FROM to_timestamp(j.end_time)) as yearnum
        FROM acct_user u, acct_pbs_record j
        WHERE u.user_name = $1 AND u.acct_user_id = j.acct_user_id
        GROUP BY yearnum
        ORDER BY yearnum
      `;

      const usageResult = await this.pool!.query(usageQuery, [userName]);

      const usages: UserUsageDTO[] = (usageResult.rows || []).map((row) => ({
        year: parseInt(row.yearnum || '0', 10),
        jobCount: parseInt(row.count || '0', 10),
        cpuTime: parseFloat(row.cpu_time || '0'),
      }));

      return {
        jobCount,
        totalCpuTime,
        usages,
      };
    } catch (error) {
      this.logger.error(
        `Error getting user info for ${userName}:`,
        error instanceof Error ? error.stack : error,
      );
      return null;
    }
  }

  /**
   * Get outages for a node
   * Returns empty array if database is not available
   */
  async getOutagesForNode(nodeName: string): Promise<OutageRecordDTO[]> {
    if (!this.isDatabaseAvailable()) {
      this.logger.debug(
        `getOutagesForNode(${nodeName}) - database not available`,
      );
      return [];
    }

    try {
      const query = `
        SELECT hostname, type, start_time, end_time, comment
        FROM acct_host h, acct_outages o
        WHERE h.hostname = $1 AND h.acct_host_id = o.acct_host_id
        ORDER BY o.start_time DESC
      `;

      const result = await this.pool!.query(query, [nodeName]);

      return (result.rows || []).map((row) => ({
        hostname: row.hostname || '',
        type: row.type || '',
        startTime: row.start_time ? new Date(row.start_time) : null,
        endTime: row.end_time ? new Date(row.end_time) : null,
        comment: row.comment || null,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting outages for node ${nodeName}:`,
        error instanceof Error ? error.stack : error,
      );
      return [];
    }
  }

  /**
   * Get list of started job IDs
   * Returns empty array if database is not available
   */
  async getStartedJobIds(): Promise<string[]> {
    if (!this.isDatabaseAvailable()) {
      this.logger.debug('getStartedJobIds() - database not available');
      return [];
    }

    this.logger.debug('getStartedJobIds()');

    try {
      const query = `
        SELECT acct_id_string
        FROM acct_pbs_record_started
        ORDER BY acct_id_string
      `;

      const result = await this.pool!.query(query);

      return (result.rows || []).map((row) => row.acct_id_string || '');
    } catch (error) {
      this.logger.error(
        'Error getting started job IDs:',
        error instanceof Error ? error.stack : error,
      );
      return [];
    }
  }

  /**
   * Get canonical organization names
   * Returns empty array if database is not available
   */
  async getCanonicalOrgNames(): Promise<CanonicalOrgNameDTO[]> {
    if (!this.isDatabaseAvailable()) {
      this.logger.debug('getCanonicalOrgNames() - database not available');
      return [];
    }

    try {
      const query = `
        SELECT user_org, name, akademie
        FROM org_names
        ORDER BY name
      `;

      const result = await this.pool!.query(query);

      return (result.rows || []).map((row) => ({
        user_org: row.user_org || '',
        name: row.name || '',
        akademie: row.akademie || null,
      }));
    } catch (error) {
      this.logger.error(
        'Error getting canonical org names:',
        error instanceof Error ? error.stack : error,
      );
      return [];
    }
  }

  /**
   * Cleanup database connection pool on module destroy
   */
  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Accounting database connection pool closed');
    }
  }
}
