import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUsers } from "@/hooks/useUsers";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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

export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, error } = useUsers();
  const { data: currentUser } = useCurrentUser();

  const isAdmin = currentUser?.role === "admin";

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
    if (!data?.users) return [];
    const servers = new Set<string>();
    for (const user of data.users) {
      if (user.fairshareRankings) {
        for (const server of Object.keys(user.fairshareRankings)) {
          servers.add(server);
        }
      }
    }
    return Array.from(servers).sort();
  }, [data?.users]);

  const sortedUsers = useMemo(() => {
    if (!data?.users) return [];

    // Filter users by search query
    let filtered = data.users;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = data.users.filter((user) => {
        const usernameMatch = user.username.toLowerCase().includes(query);
        const nicknameMatch = user.nickname?.toLowerCase().includes(query);
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
            aValue = (a.nickname || "").toLowerCase();
            bValue = (b.nickname || "").toLowerCase();
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
  }, [data?.users, sortColumn, sortDirection, searchQuery]);

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <Icon
          icon="icon-park-outline:sort"
          className="w-4 h-4 ml-1 text-gray-400"
        />
      );
    }

    return sortDirection === "asc" ? (
      <Icon
        icon="prime:sort-up-fill"
        className="w-4 h-4 ml-1 text-primary-600"
      />
    ) : (
      <Icon
        icon="prime:sort-down-fill"
        className="w-4 h-4 ml-1 text-primary-600"
      />
    );
  };

  const SortableHeader = ({
    column,
    children,
  }: {
    column: SortColumn;
    children: React.ReactNode;
  }) => (
    <div
      className="flex items-center cursor-pointer hover:text-primary-600 select-none"
      onClick={() => handleSort(column)}
    >
      {children}
      <SortIcon column={column} />
    </div>
  );

  const handleRowClick = (username: string, e?: React.MouseEvent) => {
    // Don't navigate if clicking on the impersonate button
    if (e && (e.target as HTMLElement).closest("button")) {
      return;
    }
    navigate(`/users/${username}`);
  };

  const handleImpersonate = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement impersonate functionality
    console.log("Impersonate user:", username);
  };

  // Helper function to get ranking icon based on ranking value
  // Lower number = better ranking (1 is best, higher numbers are worse)
  const getRankingIcon = (ranking: number) => {
    const rankingMiddle = (data?.users?.length ?? 80) / 2;
    const rankingRange = (data?.users?.length ?? 90) / 3;
    if (ranking <= rankingMiddle - rankingRange) {
      return (
        <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-600" />
      );
    } else if (ranking <= rankingMiddle + rankingRange) {
      return <Icon icon="mdi:alert" className="w-4 h-4 text-yellow-600" />;
    } else {
      return <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-900">
            {t("pages.users")}
          </h1>
        </div>
      </header>
      <div className="p-6">
        {/* Search Bar and Total Count */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="mdi:magnify" className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("users.searchPlaceholder")}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Icon
                  icon="mdi:close"
                  className="h-5 w-5 text-gray-400 hover:text-gray-600"
                />
              </button>
            )}
          </div>
          {data && (
            <div className="text-sm text-gray-600 whitespace-nowrap">
              {searchQuery ? (
                <>
                  {t("users.totalUsersFiltered", {
                    filtered: sortedUsers.length,
                    total: data.users.length,
                  })}
                </>
              ) : (
                <>{t("users.totalUsers", { count: data.users.length })}</>
              )}
            </div>
          )}
        </div>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">{t("common.loading")}</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              {t("common.errorLoading")}{" "}
              {error instanceof Error
                ? error.message
                : t("common.unknownError")}
            </div>
          </div>
        )}

        {data && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Table Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 min-w-max">
              {/* Two-row header structure */}
              <div className="space-y-2">
                {/* First row - main column headers */}
                <div className="flex gap-4 text-sm font-medium text-gray-700">
                  <div className="w-40">
                    <SortableHeader column="username">
                      {t("users.username")}
                    </SortableHeader>
                  </div>
                  <div className="w-48">
                    <SortableHeader column="nickname">
                      {t("users.nickname")}
                    </SortableHeader>
                  </div>
                  {/* Fairshare label - spans all server columns */}
                  {fairshareServers.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>{t("queues.fairshare")}</span>
                      <div className="relative group">
                        <Icon
                          icon="mdi:information"
                          className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                        />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-normal w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {t("fairshare.infoTooltip")}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="pl-4 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SortableHeader column="totalTasks">
                        <span className="text-gray-500">
                          {t("users.totalTasks")}
                        </span>
                      </SortableHeader>
                    </div>
                  </div>
                  {isAdmin && <div className="w-32">{t("users.actions")}</div>}
                </div>
                {/* Second row - server column headers */}
                {fairshareServers.length > 0 && (
                  <div className="flex gap-4 text-sm font-medium text-gray-700">
                    <div className="w-40"></div>
                    <div className="w-48"></div>
                    <div className="flex gap-2">
                      {fairshareServers.map((server) => (
                        <div key={server} className="w-30">
                          <SortableHeader
                            column={`fairshare-${server}` as SortColumn}
                          >
                            {server}
                          </SortableHeader>
                        </div>
                      ))}
                    </div>
                    <div className="w-80"></div>
                    <div className="w-28"></div>
                    {isAdmin && <div className="w-32"></div>}
                  </div>
                )}
              </div>
            </div>

            {/* Table Body */}
            <div>
              {sortedUsers.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  {t("users.noUsersFound")}
                </div>
              ) : (
                sortedUsers.map((user) => (
                  <div
                    key={user.username}
                    className="flex gap-4 items-center py-2 px-4 border-b border-gray-100 bg-white hover:bg-gray-50 cursor-pointer min-w-max"
                    onClick={(e) => handleRowClick(user.username, e)}
                  >
                    {/* Username Column */}
                    <div className="w-40">
                      <span className="font-medium text-gray-900 hover:text-primary-600">
                        {user.username}
                      </span>
                    </div>

                    {/* Nickname Column */}
                    <div className="w-48 text-sm text-gray-600">
                      {user.nickname || "-"}
                    </div>

                    {/* Fairshare Columns - one per server */}
                    {fairshareServers.map((server) => {
                      const ranking = user.fairshareRankings?.[server];
                      return (
                        <div
                          key={server}
                          className="w-20 text-sm text-gray-600"
                        >
                          {ranking !== undefined && ranking !== null ? (
                            <div className="flex items-center gap-1">
                              {getRankingIcon(ranking)}
                              <span className="font-medium">{ranking}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      );
                    })}

                    {/* Tasks Column - Same format as queues */}
                    <div className="pl-4 flex-1 text-sm text-gray-600">
                      <div className="flex gap-2 flex-wrap">
                        <div>
                          <span className="text-gray-500">
                            {t("queues.queued")}
                          </span>
                          <span className="font-medium ml-2">
                            {user.queuedTasks}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {t("queues.running")}
                          </span>
                          <span className="font-medium text-blue-600 ml-2">
                            {user.runningTasks}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {t("queues.done")}
                          </span>
                          <span className="font-medium text-green-600 ml-2">
                            {user.doneTasks}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {t("queues.total")}
                          </span>
                          <span className="font-medium ml-2">
                            {user.totalTasks}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Column - Only for admins */}
                    {isAdmin && (
                      <div className="w-32">
                        <button
                          onClick={(e) => handleImpersonate(user.username, e)}
                          className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded border border-primary-300 hover:border-primary-400"
                        >
                          {t("users.impersonate")}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
