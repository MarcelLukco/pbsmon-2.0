import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { UserListDTO } from "@/lib/generated-api";

interface UsersTableRowProps {
  user: UserListDTO;
  fairshareServers: string[];
  maxFairshare: Record<string, number>;
  isAdmin: boolean;
  onImpersonate: (username: string) => void;
}

export function UsersTableRow({
  user,
  fairshareServers,
  maxFairshare,
  isAdmin,
  onImpersonate,
}: UsersTableRowProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRowClick = (e?: React.MouseEvent) => {
    // Don't navigate if clicking on the impersonate button
    if (e && (e.target as HTMLElement).closest("button")) {
      return;
    }
    navigate(`/users/${user.username}`);
  };

  const handleImpersonate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImpersonate(user.username);
  };

  // Helper function to get ranking icon based on ranking value
  // Higher ranking = better (opposite ranking: higher numbers are better)
  const getRankingIcon = (ranking: number, maxRanking: number) => {
    const percentage = (ranking / maxRanking) * 100;
    if (percentage >= 80) {
      return (
        <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-600" />
      );
    } else if (percentage >= 50) {
      return <Icon icon="mdi:alert" className="w-4 h-4 text-yellow-600" />;
    } else {
      return <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div
      className="flex gap-4 items-center py-2 px-4 border-b border-gray-100 bg-white hover:bg-gray-50 cursor-pointer min-w-max"
      onClick={handleRowClick}
    >
      {/* Username Column */}
      <div className="w-40">
        <span className="font-medium text-gray-900 hover:text-primary-600">
          {user.username}
        </span>
      </div>

      {/* Nickname Column */}
      <div className="w-48 text-sm text-gray-600">
        {typeof user.nickname === "string"
          ? user.nickname
          : user.nickname
            ? String(user.nickname)
            : "-"}
      </div>

      {/* Fairshare Columns - one per server */}
      {fairshareServers.map((server) => {
        const ranking = user.fairshareRankings?.[server];
        const maxRanking = maxFairshare[server];
        return (
          <div key={server} className="w-20 text-sm text-gray-600">
            {ranking !== undefined && ranking !== null && maxRanking ? (
              <div className="flex items-center gap-1">
                {getRankingIcon(ranking, maxRanking)}
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
            <span className="text-gray-500">{t("queues.queued")}</span>
            <span className="font-medium ml-2">{user.queuedTasks}</span>
          </div>
          <div>
            <span className="text-gray-500">{t("queues.running")}</span>
            <span className="font-medium text-blue-600 ml-2">
              {user.runningTasks}
            </span>
          </div>
          <div>
            <span className="text-gray-500">{t("queues.done")}</span>
            <span className="font-medium text-green-600 ml-2">
              {user.doneTasks}
            </span>
          </div>
          <div>
            <span className="text-gray-500">{t("queues.total")}</span>
            <span className="font-medium ml-2">{user.totalTasks}</span>
          </div>
        </div>
      </div>

      {/* Actions Column - Only for admins */}
      {isAdmin && (
        <div className="w-32">
          <button
            onClick={handleImpersonate}
            className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded border border-primary-300 hover:border-primary-400"
          >
            {t("users.impersonate")}
          </button>
        </div>
      )}
    </div>
  );
}
