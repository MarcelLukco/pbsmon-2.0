import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueues, type QueueListDTO } from "@/hooks/useQueues";

interface QueueTreeNodeProps {
  queue: QueueListDTO;
  level: number;
  isLast: boolean;
}

function QueueTreeNode({ queue, level, isLast }: QueueTreeNodeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasChildren = queue.children && queue.children.length > 0;

  const handleRowClick = () => {
    navigate(`/queues/${queue.name}`);
  };

  const indentWidth = level * 24;

  return (
    <>
      <div className="grid grid-cols-12 gap-4 items-center py-3 px-4 hover:bg-gray-50 border-b border-gray-100 relative">
        {/* Tree connector lines */}
        {level > 0 && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 flex items-center pointer-events-none"
              style={{ left: `${indentWidth - 12}px` }}
            >
              {/* Vertical line */}
              <div
                className={`w-px bg-gray-300 ${isLast ? "h-1/2" : "h-full"}`}
                style={{ marginLeft: "11px" }}
              />
              {/* Horizontal line */}
              <div
                className="h-px bg-gray-300"
                style={{ width: "12px", marginLeft: "11px" }}
              />
            </div>
          </>
        )}

        {/* Queue Name Column */}
        <div
          className="col-span-3 flex items-center gap-2 min-w-0"
          style={{ paddingLeft: `${indentWidth}px` }}
        >
          {/* Spacer for alignment */}
          <div className="w-5 flex-shrink-0" />

          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Route icon next to name */}
            {queue.queueType === "Route" && (
              <div className="relative group flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {t("queues.routeQueue")}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
            <span
              className="font-medium text-gray-900 cursor-pointer hover:text-primary-600 truncate"
              onClick={handleRowClick}
            >
              {queue.name}
            </span>
            {queue.hasAccess === false && (
              <span
                className="flex items-center px-2 py-0.5 text-xs rounded bg-red-100 text-red-800 flex-shrink-0"
                title={t("queues.noAccess")}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 17v1m6-7V9a6 6 0 00-12 0v2a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2zm-6 4a2 2 0 104 0 2 2 0 00-4 0z"
                  />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Priority Column */}
        <div className="col-span-1 text-sm text-gray-600">
          {queue.priority !== null && queue.priority !== undefined
            ? queue.priority
            : "-"}
        </div>

        {/* Time Limits Column */}
        <div className="col-span-2 text-sm text-gray-600">
          {queue.minWalltime || queue.maxWalltime ? (
            <span>
              {queue.minWalltime && queue.maxWalltime
                ? `${queue.minWalltime} - ${queue.maxWalltime}`
                : queue.minWalltime
                  ? `${t("queues.min")}: ${queue.minWalltime}`
                  : `${t("queues.max")}: ${queue.maxWalltime}`}
            </span>
          ) : (
            "-"
          )}
        </div>

        {/* Jobs Column */}
        <div className="col-span-1 text-sm text-gray-600">
          {queue.totalJobs !== null && queue.totalJobs !== undefined
            ? queue.totalJobs
            : "-"}
        </div>
        {/* Status Column */}
        <div className="col-span-2 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                queue.enabled ? "bg-green-500" : "bg-gray-400"
              }`}
              title={queue.enabled ? t("queues.enabled") : t("queues.disabled")}
            />
            <span className="text-xs text-gray-600">
              {queue.enabled ? t("queues.enabled") : t("queues.disabled")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                queue.started ? "bg-green-500" : "bg-gray-400"
              }`}
              title={queue.started ? t("queues.started") : t("queues.stopped")}
            />
            <span className="text-xs text-gray-600">
              {queue.started ? t("queues.started") : t("queues.stopped")}
            </span>
          </div>
        </div>
      </div>

      {/* Children - Always expanded */}
      {hasChildren && (
        <>
          {queue.children!.map((child, index) => (
            <QueueTreeNode
              key={child.name}
              queue={child}
              level={level + 1}
              isLast={index === queue.children!.length - 1}
            />
          ))}
        </>
      )}
    </>
  );
}

// Filter queues to only include enabled and started queues (recursively)
function filterEnabledAndStartedQueues(queues: QueueListDTO[]): QueueListDTO[] {
  return queues
    .filter((queue) => queue.enabled && queue.started)
    .map((queue) => {
      const filteredQueue: QueueListDTO = { ...queue };
      if (queue.children && queue.children.length > 0) {
        filteredQueue.children = filterEnabledAndStartedQueues(queue.children);
      }
      return filteredQueue;
    });
}

export function JobsQueuesPage() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQueues();

  // Filter to only show enabled and started queues
  const filteredQueues = data ? filterEnabledAndStartedQueues(data.queues) : [];

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-900">
            {t("pages.queues")}
          </h1>
        </div>
      </header>
      <div className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">{t("queues.loading")}</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              {t("queues.errorLoading")}{" "}
              {error instanceof Error
                ? error.message
                : t("queues.unknownError")}
            </div>
          </div>
        )}

        {data && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-3">{t("queues.queueName")}</div>
                <div className="col-span-1">{t("queues.priority")}</div>
                <div className="col-span-2">{t("queues.timeLimits")}</div>
                <div className="col-span-1">{t("queues.jobs")}</div>
                <div className="col-span-2">{t("queues.status")}</div>
              </div>
            </div>

            {/* Table Body */}
            <div>
              {filteredQueues.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  {t("queues.noQueuesFound")}
                </div>
              ) : (
                filteredQueues.map((queue, index) => (
                  <QueueTreeNode
                    key={queue.name}
                    queue={queue}
                    level={0}
                    isLast={index === filteredQueues.length - 1}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
