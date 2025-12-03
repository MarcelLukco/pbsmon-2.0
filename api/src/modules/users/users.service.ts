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
   * Get list of users with pagination, sorting, and search
   * @param userContext User context for access control
   * @param page Page number (1-based)
   * @param limit Items per page
   * @param sort Sort column
   * @param order Sort direction
   * @param search Search query
   */
  getUsers(
    userContext: UserContext,
    page: number = 1,
    limit: number = 20,
    sort: string = 'username',
    order: 'asc' | 'desc' = 'asc',
    search?: string,
  ): {
    data: UsersListDTO;
    totalCount: number;
    maxFairshare: Record<string, number>;
  } {
    const pbsData = this.dataCollectionService.getPbsData();
    const perunData = this.dataCollectionService.getPerunData();

    // Collect all jobs and map them to usernames
    const userJobsMap = new Map<string, PbsJob[]>();
    const usernamesWithJobs = new Set<string>();

    if (pbsData?.servers) {
      for (const serverData of Object.values(pbsData.servers)) {
        if (serverData.jobs?.items) {
          for (const job of serverData.jobs.items) {
            const jobOwner = job.attributes.Job_Owner || '';
            const ownerUsername = jobOwner.split('@')[0];
            if (ownerUsername) {
              usernamesWithJobs.add(ownerUsername);
              if (!userJobsMap.has(ownerUsername)) {
                userJobsMap.set(ownerUsername, []);
              }
              userJobsMap.get(ownerUsername)!.push(job);
            }
          }
        }
      }
    }

    // Start with ALL Perun users (not just users with jobs)
    const allUsers: UserListDTO[] = [];
    const perunUsersMap = new Map<string, string>();

    if (perunData?.users?.users) {
      for (const perunUser of perunData.users.users) {
        if (perunUser.logname) {
          const lognameBase = perunUser.logname.split('@')[0];
          perunUsersMap.set(perunUser.logname, perunUser.name);
          if (lognameBase !== perunUser.logname) {
            perunUsersMap.set(lognameBase, perunUser.name);
          }
        }
      }
    }

    // Build user list from ALL Perun users
    const allPerunUsernames = new Set<string>();
    if (perunData?.users?.users) {
      for (const perunUser of perunData.users.users) {
        if (perunUser.logname) {
          const lognameBase = perunUser.logname.split('@')[0];
          allPerunUsernames.add(lognameBase);
        }
      }
    }

    // Also include users with jobs who might not be in Perun
    for (const username of usernamesWithJobs) {
      allPerunUsernames.add(username);
    }

    // Build fairshare rankings lookup map (only for users with jobs)
    // Rankings: higher fairshare value = better ranking (lower number)
    const { lookup: fairshareRankingsLookup, maxRankings } =
      this.buildFairshareRankingsLookup(pbsData?.servers, usernamesWithJobs);

    // Build user list for all users
    for (const username of allPerunUsernames) {
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

      const nickname =
        perunUsersMap.get(username) ||
        perunUsersMap.get(username.split('@')[0]) ||
        null;

      const totalTasks =
        tasks.transit +
        tasks.queued +
        tasks.held +
        tasks.waiting +
        tasks.running +
        tasks.exiting +
        tasks.begun;

      const doneTasks = tasks.begun + tasks.exiting;

      // Get fairshare rankings (only for users with jobs)
      let fairshareRankings: Record<string, number> | null = null;
      if (jobs.length > 0) {
        // Try multiple username variations to match fairshare entries
        const usernameNormalized = username.trim();
        const usernameBase = usernameNormalized.split('@')[0];
        const usernameLower = usernameNormalized.toLowerCase();
        const usernameBaseLower = usernameBase.toLowerCase();

        // Try exact match first, then base, then lowercase variations
        const rankingsMap =
          fairshareRankingsLookup.get(usernameNormalized) ||
          fairshareRankingsLookup.get(usernameBase) ||
          fairshareRankingsLookup.get(usernameLower) ||
          fairshareRankingsLookup.get(usernameBaseLower);

        fairshareRankings =
          rankingsMap && Object.keys(rankingsMap).length > 0
            ? rankingsMap
            : null;
      }

      allUsers.push({
        username,
        nickname: nickname || null,
        totalTasks,
        queuedTasks: tasks.queued,
        runningTasks: tasks.running,
        doneTasks,
        cpuTasks,
        fairshareRankings,
      });
    }

    // Apply search filter
    let filteredUsers = allUsers;
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filteredUsers = allUsers.filter((user) => {
        const usernameMatch = user.username.toLowerCase().includes(searchLower);
        const nicknameMatch = user.nickname
          ? user.nickname.toLowerCase().includes(searchLower)
          : false;
        return usernameMatch || nicknameMatch;
      });
    }

    // Apply sorting
    filteredUsers = this.sortUsers(filteredUsers, sort, order);

    // Apply pagination
    const totalCount = filteredUsers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Get fairshare server names from PBS data
    const fairshareServers = pbsData?.servers
      ? Object.keys(pbsData.servers).sort()
      : [];

    // maxRankings is already calculated in buildFairshareRankingsLookup
    const maxFairshare = maxRankings;

    return {
      data: { users: paginatedUsers, fairshareServers },
      totalCount,
      maxFairshare,
    };
  }

  /**
   * Sort users by column and direction
   * For fairshare sorting, users without fairshare are always at the end
   */
  private sortUsers(
    users: UserListDTO[],
    sort: string,
    order: 'asc' | 'desc',
  ): UserListDTO[] {
    const sorted = [...users].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      let aHasValue = true;
      let bHasValue = true;

      if (sort.startsWith('fairshare-')) {
        const serverName = sort.replace('fairshare-', '');
        aHasValue = a.fairshareRankings?.[serverName] !== undefined;
        bHasValue = b.fairshareRankings?.[serverName] !== undefined;

        // Users without fairshare always go to the end
        if (!aHasValue && !bHasValue) return 0;
        if (!aHasValue) return 1; // a goes to end
        if (!bHasValue) return -1; // b goes to end

        // Higher ranking is better (opposite ranking), so reverse comparison
        aValue = a.fairshareRankings![serverName];
        bValue = b.fairshareRankings![serverName];
      } else {
        switch (sort) {
          case 'username':
            aValue = a.username.toLowerCase();
            bValue = b.username.toLowerCase();
            break;
          case 'nickname':
            aValue = (a.nickname || '').toLowerCase();
            bValue = (b.nickname || '').toLowerCase();
            break;
          case 'totalTasks':
            aValue = a.totalTasks;
            bValue = b.totalTasks;
            break;
          case 'queuedTasks':
            aValue = a.queuedTasks;
            bValue = b.queuedTasks;
            break;
          case 'runningTasks':
            aValue = a.runningTasks;
            bValue = b.runningTasks;
            break;
          case 'doneTasks':
            aValue = a.doneTasks;
            bValue = b.doneTasks;
            break;
          case 'cpuTasks':
            aValue = a.cpuTasks;
            bValue = b.cpuTasks;
            break;
          default:
            // Default to username
            aValue = a.username.toLowerCase();
            bValue = b.username.toLowerCase();
            break;
        }
      }

      // For fairshare, higher ranking is better (opposite ranking), reverse comparison
      // For other columns, normal comparison
      if (sort.startsWith('fairshare-')) {
        // Higher ranking number = better, so reverse the comparison
        if (aValue < bValue) return order === 'asc' ? 1 : -1; // Higher is better
        if (aValue > bValue) return order === 'asc' ? -1 : 1; // Higher is better
        return 0;
      }

      // For other columns, normal comparison
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
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

    // Build Perun users lookup map for O(1) access instead of O(n) find()
    const perunUsersMap = new Map<string, string>();
    if (perunData?.users?.users) {
      for (const perunUser of perunData.users.users) {
        if (perunUser.logname) {
          const lognameBase = perunUser.logname.split('@')[0];
          perunUsersMap.set(perunUser.logname, perunUser.name);
          if (lognameBase !== perunUser.logname) {
            perunUsersMap.set(lognameBase, perunUser.name);
          }
        }
      }
    }

    // Get user nickname from Perun using O(1) map lookup
    const nickname =
      perunUsersMap.get(username) ||
      perunUsersMap.get(username.split('@')[0]) ||
      null;

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
   * Build fairshare rankings lookup map (only for users with jobs)
   * Rankings: higher fairshare value = better ranking (lower number like 1, 2, 3...)
   * Returns { lookup: Map<username, Record<serverName, ranking>>, maxRankings: Record<serverName, maxRank> }
   */
  private buildFairshareRankingsLookup(
    servers?: Record<string, any>,
    usernamesWithJobs?: Set<string>,
  ): {
    lookup: Map<string, Record<string, number>>;
    maxRankings: Record<string, number>;
  } {
    const lookup = new Map<string, Record<string, number>>();
    const maxRankings: Record<string, number> = {};

    if (!servers) {
      return { lookup, maxRankings };
    }

    // For each server, calculate rankings among users with jobs
    for (const [serverName, serverData] of Object.entries(servers)) {
      if (!serverData.fairshare?.entries) {
        continue;
      }

      // Filter to only users with jobs (if provided)
      let relevantEntries = serverData.fairshare.entries.filter(
        (entry: { username: string; value2: number }) => {
          if (
            !entry.username ||
            entry.username.trim() === '' ||
            entry.username.trim() === 'TREEROOT' ||
            entry.username.trim().startsWith('TREE') ||
            entry.value2 === undefined ||
            entry.value2 === null
          ) {
            return false;
          }

          // If we have a list of usernames with jobs, only include those
          if (usernamesWithJobs && usernamesWithJobs.size > 0) {
            const entryUsername = entry.username.trim();
            const entryUsernameBase = entryUsername.split('@')[0];
            return (
              usernamesWithJobs.has(entryUsername) ||
              usernamesWithJobs.has(entryUsernameBase)
            );
          }

          return true;
        },
      );

      // Sort by value2 descending (higher value = better)
      relevantEntries.sort((a, b) => b.value2 - a.value2);

      // Calculate rankings: same value2 = same rank
      // Higher fairshare value = higher (better) ranking number (opposite ranking)
      const rankings = new Map<string, number>();
      const totalUsers = relevantEntries.length;
      let currentRank = totalUsers; // Start from highest rank (worst position = best rank)

      for (let i = 0; i < relevantEntries.length; i++) {
        const entry = relevantEntries[i];
        const entryUsername = entry.username.trim();
        const entryUsernameBase = entryUsername.split('@')[0];

        // If same value as previous, use same rank
        if (i > 0 && relevantEntries[i - 1].value2 === entry.value2) {
          // Use the rank from previous entry
          const prevRank = rankings.get(relevantEntries[i - 1].username.trim());
          if (prevRank !== undefined) {
            currentRank = prevRank;
          }
        } else {
          // New rank: reverse order (highest value gets highest rank number)
          // Position 0 (best) gets rank = totalUsers, position 1 gets rank = totalUsers - 1, etc.
          currentRank = totalUsers - i;
        }

        // Store ranking for both full username and base username
        const usernamesToStore = [
          entryUsername,
          entryUsernameBase,
          entryUsername.toLowerCase(),
          entryUsernameBase.toLowerCase(),
        ].filter((u) => u && u.length > 0);

        for (const usernameKey of usernamesToStore) {
          if (!lookup.has(usernameKey)) {
            lookup.set(usernameKey, {});
          }
          const userRankings = lookup.get(usernameKey)!;
          userRankings[serverName] = currentRank;
        }

        // Track maximum ranking for this server (worst ranking = number of users with jobs)
        if (relevantEntries.length > 0) {
          maxRankings[serverName] = relevantEntries.length;
        }
      }
    }

    return { lookup, maxRankings };
  }

  /**
   * Get fairshare values for a user across all servers
   * Returns the actual fairshare value (value2) - higher is better
   * Note: This is used for user detail view, for list view use buildFairshareLookup
   */
  private getFairshareValuesForUser(
    username: string,
    servers?: Record<string, any>,
  ): Record<string, number> {
    const values: Record<string, number> = {};

    if (!servers) {
      return values;
    }

    const usernameBase = username.split('@')[0];

    for (const [serverName, serverData] of Object.entries(servers)) {
      if (!serverData.fairshare?.entries) {
        continue;
      }

      // Find the user's entry in fairshare data
      const userEntry = serverData.fairshare.entries.find(
        (entry: { username: string; value2: number }) => {
          const entryUsername = entry.username;
          const entryUsernameBase = entryUsername.split('@')[0];
          return (
            (entryUsername === username ||
              entryUsername === usernameBase ||
              entryUsernameBase === username ||
              entryUsernameBase === usernameBase) &&
            entry.value2 !== undefined &&
            entry.value2 !== null &&
            entry.value2 > 0
          );
        },
      );

      if (
        userEntry &&
        userEntry.value2 !== undefined &&
        userEntry.value2 !== null
      ) {
        values[serverName] = userEntry.value2;
      }
    }

    return values;
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

    // Get fairshare values for each server
    const username = userJobs[0]?.job.attributes.Job_Owner?.split('@')[0] || '';
    const values = this.getFairshareValuesForUser(username, servers);

    // Convert to array format - for detail view, we still return ranking format
    // but we'll calculate it from the values
    const result: UserFairshareDTO[] = [];
    for (const server of uniqueServers) {
      const value = values[server];
      // For detail view, we return the value as ranking for now
      // TODO: Consider updating UserFairshareDTO to include value instead of ranking
      result.push({
        server,
        ranking: value !== undefined ? value : null,
      });
    }

    return result;
  }
}
