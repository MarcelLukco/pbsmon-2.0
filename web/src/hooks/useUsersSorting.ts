import { useState, useMemo } from "react";
import type { UserListDTO } from "@/lib/generated-api";

type SortColumn =
  | "username"
  | "nickname"
  | "totalTasks"
  | "queuedTasks"
  | "runningTasks"
  | "doneTasks"
  | "cpuTasks"
  | `fairshare-${string}`;
type SortDirection = "asc" | "desc";

export function useUsersSorting(users: UserListDTO[] | undefined) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("username");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Get all unique server names from fairshare rankings
  const fairshareServers = useMemo(() => {
    if (!users) return [];
    const servers = new Set<string>();
    for (const user of users) {
      if (user.fairshareRankings) {
        for (const server of Object.keys(user.fairshareRankings)) {
          servers.add(server);
        }
      }
    }
    return Array.from(servers).sort();
  }, [users]);

  const sortedUsers = useMemo(() => {
    if (!users) return [];

    // Filter users by search query
    let filtered = users;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = users.filter((user) => {
        const usernameMatch = user.username.toLowerCase().includes(query);
        // Handle nickname - it might be string or Record<string, any> from generated types
        const nicknameStr =
          typeof user.nickname === "string"
            ? user.nickname
            : user.nickname
              ? String(user.nickname)
              : "";
        const nicknameMatch = nicknameStr.toLowerCase().includes(query);
        return usernameMatch || nicknameMatch;
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortColumn.startsWith("fairshare-")) {
        const serverName = sortColumn.replace("fairshare-", "");
        aValue = a.fairshareRankings?.[serverName] ?? Number.MAX_SAFE_INTEGER;
        bValue = b.fairshareRankings?.[serverName] ?? Number.MAX_SAFE_INTEGER;
      } else {
        switch (sortColumn) {
          case "username":
            aValue = a.username.toLowerCase();
            bValue = b.username.toLowerCase();
            break;
          case "nickname":
            // Handle nickname - it might be string or Record<string, any> from generated types
            const aNickname =
              typeof a.nickname === "string"
                ? a.nickname
                : a.nickname
                  ? String(a.nickname)
                  : "";
            const bNickname =
              typeof b.nickname === "string"
                ? b.nickname
                : b.nickname
                  ? String(b.nickname)
                  : "";
            aValue = aNickname.toLowerCase();
            bValue = bNickname.toLowerCase();
            break;
          case "totalTasks":
            aValue = a.totalTasks;
            bValue = b.totalTasks;
            break;
          case "queuedTasks":
            aValue = a.queuedTasks;
            bValue = b.queuedTasks;
            break;
          case "runningTasks":
            aValue = a.runningTasks;
            bValue = b.runningTasks;
            break;
          case "doneTasks":
            aValue = a.doneTasks;
            bValue = b.doneTasks;
            break;
          case "cpuTasks":
            aValue = a.cpuTasks;
            bValue = b.cpuTasks;
            break;
          default:
            return 0;
        }
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [users, sortColumn, sortDirection, searchQuery]);

  return {
    sortColumn,
    sortDirection,
    searchQuery,
    setSearchQuery,
    handleSort,
    fairshareServers,
    sortedUsers,
  };
}
