import { Injectable, NotFoundException } from '@nestjs/common';
import { DataCollectionService } from '@/modules/data-collection/data-collection.service';
import { UserContext, UserRole } from '@/common/types/user-context.types';
import { GroupListDTO, GroupsListDTO } from './dto/group-list.dto';
import { GroupDetailDTO, GroupMemberDTO } from './dto/group-detail.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  /**
   * Get list of all groups
   * Admin sees all groups, non-admin sees only groups they are a member of
   */
  getGroups(userContext: UserContext): GroupsListDTO {
    const perunData = this.dataCollectionService.getPerunData();

    if (!perunData?.etcGroups || perunData.etcGroups.length === 0) {
      return { groups: [] };
    }

    // Extract username base (without @domain if present)
    const usernameBase = userContext.username.split('@')[0];

    // Collect all unique groups across all servers
    const groupsMap = new Map<string, { gid: string; members: Set<string> }>();

    for (const serverGroups of perunData.etcGroups) {
      for (const group of serverGroups.entries) {
        // For non-admin users, only include groups they are a member of
        if (userContext.role !== UserRole.ADMIN) {
          const isMember =
            group.members.includes(usernameBase) ||
            group.members.includes(userContext.username);
          if (!isMember) {
            continue;
          }
        }

        if (!groupsMap.has(group.groupname)) {
          groupsMap.set(group.groupname, {
            gid: group.gid,
            members: new Set(group.members),
          });
        } else {
          // If group exists, merge members from all servers
          const existing = groupsMap.get(group.groupname)!;
          for (const member of group.members) {
            existing.members.add(member);
          }
        }
      }
    }

    let groups: GroupListDTO[] = Array.from(groupsMap.entries())
      .map(([name, data]) => ({
        name,
        gid: data.gid,
        memberCount: data.members.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // For non-admin users, filter out groups that contain all (or nearly all) users
    // These are system-wide groups like "meta" and "storage" that include everyone
    if (userContext.role !== UserRole.ADMIN) {
      // Calculate total unique users in the system
      const allUsersSet = new Set<string>();
      if (perunData?.users?.users) {
        for (const perunUser of perunData.users.users) {
          if (perunUser.logname) {
            const lognameBase = perunUser.logname.split('@')[0];
            allUsersSet.add(lognameBase);
            allUsersSet.add(perunUser.logname);
          }
        }
      }
      const totalUsers = allUsersSet.size;

      if (totalUsers > 0) {
        // Filter out groups that contain more than 80% of all users
        // This catches system-wide groups like "meta" and "storage"
        // with some tolerance for users that might not be in Perun
        const MAX_PERCENTAGE_OF_ALL_USERS = 0.8; // 80%
        groups = groups.filter((group) => {
          const percentage = group.memberCount / totalUsers;
          return percentage <= MAX_PERCENTAGE_OF_ALL_USERS;
        });
      }
    }

    return { groups };
  }

  /**
   * Get group detail by name
   * Admin can see any group, non-admin can only see groups they are a member of
   */
  getGroupDetail(groupName: string, userContext: UserContext): GroupDetailDTO {
    const perunData = this.dataCollectionService.getPerunData();

    if (!perunData?.etcGroups || perunData.etcGroups.length === 0) {
      throw new NotFoundException(`Group '${groupName}' was not found`);
    }

    // Extract username base (without @domain if present)
    const usernameBase = userContext.username.split('@')[0];

    // Find the group across all servers
    let foundGroup: { gid: string; members: Set<string> } | null = null;

    for (const serverGroups of perunData.etcGroups) {
      for (const group of serverGroups.entries) {
        if (group.groupname === groupName) {
          // For non-admin users, check if they are a member
          if (userContext.role !== UserRole.ADMIN) {
            const isMember =
              group.members.includes(usernameBase) ||
              group.members.includes(userContext.username);
            if (!isMember) {
              continue;
            }
          }

          if (!foundGroup) {
            foundGroup = {
              gid: group.gid,
              members: new Set(group.members),
            };
          } else {
            // Merge members from all servers
            for (const member of group.members) {
              foundGroup.members.add(member);
            }
          }
        }
      }
    }

    if (!foundGroup) {
      throw new NotFoundException(`Group '${groupName}' was not found`);
    }

    // Get user names from Perun data
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

    // Build member list with nickname and name
    const members: GroupMemberDTO[] = Array.from(foundGroup.members)
      .map((nickname) => ({
        nickname,
        name: perunUsersMap.get(nickname) || null,
      }))
      .sort((a, b) => a.nickname.localeCompare(b.nickname));

    return {
      name: groupName,
      gid: foundGroup.gid,
      members,
    };
  }
}
