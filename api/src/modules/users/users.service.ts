import { Injectable, NotFoundException } from '@nestjs/common';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import { PbsJob } from '@/modules/data-collection/types/pbs.types';
import { UserContext, UserRole } from '@/common/types/user-context.types';
import {
  UserDetailDTO,
  UserTaskCountDTO,
  UserFairshareDTO,
} from './dto/user-detail.dto';
import { UsersListDTO, UserListDTO } from './dto/user-list.dto';

@Injectable()
export class UsersService {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  /**
   * Get list of users
   * @param userContext User context for access control
   */
  getUsers(userContext: UserContext): UsersListDTO {
    const pbsData = this.dataCollectionService.getPbsData();
    const perunData = this.dataCollectionService.getPerunData();

    // Collect all unique usernames from jobs
    const usernameSet = new Set<string>();
    const userJobsMap = new Map<string, PbsJob[]>();

    if (pbsData?.servers) {
      for (const serverData of Object.values(pbsData.servers)) {
        if (serverData.jobs?.items) {
          for (const job of serverData.jobs.items) {
            const jobOwner = job.attributes.Job_Owner || '';
            const ownerUsername = jobOwner.split('@')[0];
            if (ownerUsername) {
              usernameSet.add(ownerUsername);
              if (!userJobsMap.has(ownerUsername)) {
                userJobsMap.set(ownerUsername, []);
              }
              userJobsMap.get(ownerUsername)!.push(job);
            }
          }
        }
      }
    }

    // Build user list
    const users: UserListDTO[] = [];
    const usernames = Array.from(usernameSet).sort();

    for (const username of usernames) {
      // Filter: admin sees all, non-admin sees only themselves
      if (
        userContext.role !== UserRole.ADMIN &&
        userContext.username !== username &&
        userContext.username.split('@')[0] !== username
      ) {
        continue;
      }

      const jobs = userJobsMap.get(username) || [];
      const tasks = this.calculateTaskCounts(jobs);
      const cpuTasks = this.calculateCpuTasks(jobs);

      // Get nickname from Perun
      let nickname: string | null = null;
      if (perunData?.users?.users) {
        const perunUser = perunData.users.users.find(
          (u) => u.logname === username || u.logname === username.split('@')[0],
        );
        if (perunUser) {
          nickname = perunUser.name;
        }
      }

      const totalTasks =
        tasks.transit +
        tasks.queued +
        tasks.held +
        tasks.waiting +
        tasks.running +
        tasks.exiting +
        tasks.begun;

      const doneTasks = tasks.begun + tasks.exiting;

      // Collect all usernames who have jobs (for ranking calculation)
      const allUsernamesWithJobs = new Set<string>();
      if (pbsData?.servers) {
        for (const serverData of Object.values(pbsData.servers)) {
          if (serverData.jobs?.items) {
            for (const job of serverData.jobs.items) {
              const jobOwner = job.attributes.Job_Owner || '';
              const ownerUsername = jobOwner.split('@')[0];
              if (ownerUsername) {
                allUsernamesWithJobs.add(ownerUsername);
              }
            }
          }
        }
      }

      // Get fairshare rankings per server (only among users with jobs)
      const fairshareRankings = this.getFairshareRankingsForUser(
        username,
        pbsData?.servers,
        allUsernamesWithJobs,
      );

      users.push({
        username,
        nickname: nickname || null,
        totalTasks,
        queuedTasks: tasks.queued,
        runningTasks: tasks.running,
        doneTasks,
        cpuTasks,
        fairshareRankings:
          Object.keys(fairshareRankings).length > 0 ? fairshareRankings : null,
      });
    }

    return { users };
  }

  /**
   * Get user detail by username
   * @param username User login name
   * @param userContext User context for access control
   */
  getUserDetail(username: string, userContext: UserContext): UserDetailDTO {
    // Check if user is admin or viewing their own profile
    if (
      userContext.role !== UserRole.ADMIN &&
      userContext.username !== username
    ) {
      throw new NotFoundException(`User '${username}' was not found`);
    }

    const pbsData = this.dataCollectionService.getPbsData();
    const perunData = this.dataCollectionService.getPerunData();

    // Get user nickname from Perun
    let nickname: string | null = null;
    if (perunData?.users?.users) {
      const perunUser = perunData.users.users.find(
        (u) => u.logname === username || u.logname === username.split('@')[0],
      );
      if (perunUser) {
        nickname = perunUser.name;
      }
    }

    // Collect all jobs for this user across all servers
    const userJobs: Array<{ job: PbsJob; server: string }> = [];
    if (pbsData?.servers) {
      for (const [serverName, serverData] of Object.entries(pbsData.servers)) {
        if (serverData.jobs?.items) {
          for (const job of serverData.jobs.items) {
            const jobOwner = job.attributes.Job_Owner || '';
            // Job_Owner format is typically "username@hostname" or just "username"
            const ownerUsername = jobOwner.split('@')[0];
            if (
              ownerUsername === username ||
              ownerUsername === username.split('@')[0]
            ) {
              userJobs.push({ job, server: serverName });
            }
          }
        }
      }
    }

    // Calculate task counts (same as queue state counts)
    const tasks = this.calculateTaskCounts(userJobs.map(({ job }) => job));

    // Calculate CPU tasks (running jobs with CPU resources)
    const cpuTasks = this.calculateCpuTasks(userJobs.map(({ job }) => job));

    // Get fairshare per server
    const fairsharePerServer = this.getFairsharePerServer(
      userJobs,
      pbsData?.servers,
    );

    return {
      username,
      nickname: nickname || null,
      tasks,
      cpuTasks,
      fairsharePerServer,
    };
  }

  /**
   * Calculate task counts from jobs (same as queue state counts)
   */
  private calculateTaskCounts(jobs: PbsJob[]): UserTaskCountDTO {
    const counts: UserTaskCountDTO = {
      transit: 0,
      queued: 0,
      held: 0,
      waiting: 0,
      running: 0,
      exiting: 0,
      begun: 0,
    };

    for (const job of jobs) {
      const state = job.attributes.job_state || '';
      switch (state) {
        case 'T':
        case 'Transit':
          counts.transit++;
          break;
        case 'Q':
        case 'Queued':
          counts.queued++;
          break;
        case 'H':
        case 'Held':
          counts.held++;
          break;
        case 'W':
        case 'Waiting':
          counts.waiting++;
          break;
        case 'R':
        case 'Running':
          counts.running++;
          break;
        case 'E':
        case 'Exiting':
          counts.exiting++;
          break;
        case 'B':
        case 'Begun':
          counts.begun++;
          break;
      }
    }

    return counts;
  }

  /**
   * Calculate CPU tasks (running jobs with CPU resources)
   */
  private calculateCpuTasks(jobs: PbsJob[]): number {
    let cpuTasks = 0;
    for (const job of jobs) {
      const state = job.attributes.job_state || '';
      if (state === 'R' || state === 'Running') {
        // Check if job has CPU resources
        const ncpus =
          job.attributes['Resource_List.ncpus'] ||
          job.attributes['Resource_List.NCPUS'];
        if (ncpus) {
          // If ncpus is specified, count it as a CPU task
          cpuTasks++;
        } else {
          // If no explicit ncpus, check if it's a running job (likely uses CPU)
          cpuTasks++;
        }
      }
    }
    return cpuTasks;
  }

  /**
   * Get fairshare rankings for a user across all servers
   * Rankings are calculated only among users who have jobs (appear in the users list)
   */
  private getFairshareRankingsForUser(
    username: string,
    servers?: Record<string, any>,
    allUsernames?: Set<string>,
  ): Record<string, number> {
    const rankings: Record<string, number> = {};

    if (!servers) {
      return rankings;
    }

    for (const [serverName, serverData] of Object.entries(servers)) {
      if (!serverData.fairshare?.entries) {
        continue;
      }

      // Find the user's entry in fairshare data
      const userEntry = serverData.fairshare.entries.find(
        (entry: { username: string }) =>
          entry.username === username ||
          entry.username === username.split('@')[0],
      );

      if (userEntry) {
        // Filter to only include actual users (exclude system entries like TREEROOT)
        // AND only include users who have jobs (if allUsernames is provided)
        let userEntries = serverData.fairshare.entries.filter(
          (entry: { username: string }) =>
            entry.username !== 'TREEROOT' &&
            !entry.username.startsWith('TREE') &&
            entry.username.trim() !== '',
        );

        // If we have a list of all usernames (users with jobs), filter to only those
        if (allUsernames && allUsernames.size > 0) {
          userEntries = userEntries.filter((entry: { username: string }) =>
            allUsernames.has(entry.username),
          );
        }

        // Make sure the userEntry is in the filtered list
        const entryInFilteredList = userEntries.find(
          (e: { username: string }) => e.username === userEntry.username,
        );

        if (entryInFilteredList) {
          // Calculate ranking for this server (only among users with jobs)
          const ranking = this.calculateRankingForEntry(
            entryInFilteredList,
            userEntries,
          );
          rankings[serverName] = ranking;
        }
      }
    }

    return rankings;
  }

  /**
   * Calculate ranking for a specific fairshare entry
   * Lower fairshare value (value2) = better ranking (lower number)
   * Users with the same fairshare value get the same ranking
   * Ranking goes from 1 (best) to total number of users (worst)
   * Note: allEntries should already be filtered to only include users
   */
  private calculateRankingForEntry(
    entry: { username: string; value1: number; value2: number },
    allEntries: Array<{ username: string; value1: number; value2: number }>,
  ): number {
    // Sort by value2 (fairshare value) in ascending order (lower is better)
    const sorted = [...allEntries].sort((a, b) => a.value2 - b.value2);

    // Calculate rankings for all entries
    // Ranking logic: same value2 = same rank, different value2 = new rank based on position
    const rankings = new Map<string, number>();

    for (let i = 0; i < sorted.length; i++) {
      let rank: number;

      if (i === 0) {
        // First entry always gets rank 1
        rank = 1;
      } else if (sorted[i].value2 === sorted[i - 1].value2) {
        // Same value2 as previous entry - same rank
        rank = rankings.get(sorted[i - 1].username)!;
      } else {
        // Different value2 - rank is position + 1 (1-based indexing)
        rank = i + 1;
      }

      rankings.set(sorted[i].username, rank);
    }

    // Return the ranking for the requested entry
    return rankings.get(entry.username) ?? sorted.length;
  }

  /**
   * Get fairshare information per server
   * Returns rankings from fairshare data
   */
  private getFairsharePerServer(
    userJobs: Array<{ job: PbsJob; server: string }>,
    servers?: Record<string, any>,
  ): UserFairshareDTO[] {
    // Get unique servers from user jobs
    const uniqueServers = new Set<string>();
    for (const { server } of userJobs) {
      uniqueServers.add(server);
    }

    // Get fairshare rankings for each server
    const username = userJobs[0]?.job.attributes.Job_Owner?.split('@')[0] || '';
    const rankings = this.getFairshareRankingsForUser(username, servers);

    // Convert to array format
    const result: UserFairshareDTO[] = [];
    for (const server of uniqueServers) {
      result.push({
        server,
        ranking: rankings[server] || null,
      });
    }

    return result;
  }
}
