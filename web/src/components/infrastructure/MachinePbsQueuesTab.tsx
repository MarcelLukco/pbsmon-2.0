import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import type { QueueListDTO } from "@/lib/generated-api";

interface MachinePbsQueuesTabProps {
  nodeQueues: QueueListDTO[];
}

export function MachinePbsQueuesTab({ nodeQueues }: MachinePbsQueuesTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (nodeQueues.length === 0) {
    return (
      <div className="px-6 py-4">
        <div className="text-gray-500">{t("machines.noQueues")}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
          <div className="col-span-3">{t("queues.queueName")}</div>
          <div className="col-span-1">{t("queues.priority")}</div>
          <div className="col-span-2">{t("queues.timeLimits")}</div>
          <div className="col-span-5">{t("queues.jobs")}</div>
          <div className="col-span-1">{t("queues.fairshare")}</div>
        </div>
      </div>

      {/* Table Body */}
      <div>
        {nodeQueues.map((queue) => {
          const queuedJobs = queue.stateCount?.queued ?? 0;
          const runningJobs = queue.stateCount?.running ?? 0;
          const doneJobs =
            (queue.stateCount?.begun ?? 0) + (queue.stateCount?.exiting ?? 0);
          const totalJobs = queue.totalJobs ?? 0;

          const handleRowClick = () => {
            if (queue.server) {
              navigate(`/queues/${queue.name}.${queue.server}.metacentrum.cz`);
            }
          };

          return (
            <div
              key={queue.name}
              className="grid grid-cols-12 gap-2 items-center py-2 px-4 border-b border-gray-100 bg-white hover:bg-gray-50 cursor-pointer"
              onClick={handleRowClick}
            >
              {/* Queue Name Column */}
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <div className="w-5 flex-shrink-0" />
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {queue.queueType === "Route" && (
                    <div className="relative group flex-shrink-0 text-blue-600">
                      <Icon
                        icon="material-symbols:alt-route"
                        className="w-6 h-6"
                      />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {t("queues.routeQueue")}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                  <span className="font-medium text-gray-900 cursor-pointer hover:text-primary-600 truncate">
                    {queue.server
                      ? `${queue.name}.${queue.server}.metacentrum.cz`
                      : queue.name}
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
                    <span className="font-medium ml-2">
                      {String(totalJobs)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {t("queues.maxForUser")}:
                    </span>
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
          );
        })}
      </div>
    </div>
  );
}
