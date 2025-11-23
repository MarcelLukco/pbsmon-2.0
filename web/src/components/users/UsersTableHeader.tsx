import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { SortableHeader } from "./SortableHeader";

type SortColumn =
  | "username"
  | "nickname"
  | "totalTasks"
  | "queuedTasks"
  | "runningTasks"
  | "doneTasks"
  | "cpuTasks"
  | `fairshare-${string}`;

interface UsersTableHeaderProps {
  fairshareServers: string[];
  sortColumn: SortColumn;
  sortDirection: "asc" | "desc";
  onSort: (column: SortColumn) => void;
  isAdmin: boolean;
}

export function UsersTableHeader({
  fairshareServers,
  sortColumn,
  sortDirection,
  onSort,
  isAdmin,
}: UsersTableHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 min-w-max">
      {/* Two-row header structure */}
      <div className="space-y-2">
        {/* First row - main column headers */}
        <div className="flex gap-4 text-sm font-medium text-gray-700">
          <div className="w-40">
            <SortableHeader
              column="username"
              currentSortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            >
              {t("users.username")}
            </SortableHeader>
          </div>
          <div className="w-48">
            <SortableHeader
              column="nickname"
              currentSortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
            >
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
              <SortableHeader
                column="totalTasks"
                currentSortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={onSort}
              >
                <span className="text-gray-500">{t("users.totalTasks")}</span>
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
                    currentSortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={onSort}
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
  );
}
