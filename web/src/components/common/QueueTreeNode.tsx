import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import type { QueueListDTO } from "@/lib/generated-api";

interface QueueTreeNodeProps {
  queue: QueueListDTO;
  level: number;
  isLast: boolean;
}

export function QueueTreeNode({ queue, level, isLast }: QueueTreeNodeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasChildren = queue.children && queue.children.length > 0;

  const handleRowClick = () => {
    navigate(`/queues/${queue.name}.${queue.server}.metacentrum.cz`);
  };

  const indentWidth = level * 40;

  // Calculate job statistics
  const queuedJobs = queue.stateCount?.queued ?? 0;
  const runningJobs = queue.stateCount?.running ?? 0;
  const doneJobs =
    (queue.stateCount?.begun ?? 0) + (queue.stateCount?.exiting ?? 0);
  const totalJobs = queue.totalJobs ?? 0;

  // Background color based on level
  const bgColorClass =
    level === 0
      ? "bg-white hover:bg-gray-50"
      : level === 1
        ? "bg-blue-50 hover:bg-blue-100"
        : level === 2
          ? "bg-indigo-50 hover:bg-indigo-100"
          : "bg-purple-50 hover:bg-purple-100";

  return (
    <>
      <div
        className={`grid grid-cols-12 gap-2 items-center py-2 px-0 border-b border-gray-100 relative ${bgColorClass}`}
      >
        {/* Tree connector lines */}
        {level > 0 && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 flex items-center pointer-events-none"
              style={{ left: `${indentWidth - 20}px` }}
            >
              {/* Vertical line */}
              <div className={`w-px h-full`} style={{ marginLeft: "19px" }}>
                <div
                  className={`w-px bg-gray-400 ${isLast ? "h-1/2" : "h-full"}`}
                ></div>
              </div>
              {/* Horizontal line */}
              <div className="h-px bg-gray-400" style={{ width: "20px" }} />
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
              <div className="relative group flex-shrink-0 text-blue-600">
                <Icon icon="material-symbols:alt-route" className="w-6 h-6" />
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
              {`${queue.name}.${queue.server}.metacentrum.cz`}
            </span>
            {queue.hasAccess === false && (
              <span
                className="flex items-center px-2 py-0.5 text-xs rounded bg-red-100 text-red-800 flex-shrink-0"
                title={t("queues.noAccess")}
              >
                <Icon icon="bxs:lock-alt" className="w-4 h-4 mr-1" />
              </span>
            )}
          </div>
        </div>

        {/* Priority Column */}
        <div className="col-span-1 text-sm text-gray-600">
          {queue.priority !== null && queue.priority !== undefined
            ? String(queue.priority)
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

        {/* Jobs Breakdown Column */}
        <div className="col-span-5 text-sm text-gray-600 pe-12">
          <div className="flex gap-2 flex-wrap lg:justify-between">
            <div>
              <span className="text-gray-500">{t("queues.queued")}</span>
              <span className="font-medium ml-2">{queuedJobs}</span>
            </div>
            <div>
              <span className="text-gray-500">{t("queues.running")}</span>
              <span className="font-medium text-blue-600 ml-2">
                {runningJobs}
              </span>
            </div>
            <div>
              <span className="text-gray-500">{t("queues.done")}</span>
              <span className="font-medium text-green-600 ml-2">
                {doneJobs}
              </span>
            </div>
            <div>
              <span className="text-gray-500">{t("queues.total")}</span>
              <span className="font-medium ml-2">{String(totalJobs)}</span>
            </div>
            <div>
              <span className="text-gray-500">{t("queues.maxForUser")}:</span>
              <span className="ml-2">
                {queue.maximumForUser !== null &&
                queue.maximumForUser !== undefined
                  ? String(queue.maximumForUser)
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Fairshare Column */}
        <div className="col-span-1 text-sm text-gray-600">
          {typeof queue.fairshare === "string"
            ? queue.fairshare
            : queue.fairshare
              ? String(queue.fairshare)
              : ""}
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
