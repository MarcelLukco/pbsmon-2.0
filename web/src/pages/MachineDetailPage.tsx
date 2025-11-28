import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { useMachineDetail } from "@/hooks/useMachineDetail";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useJobs } from "@/hooks/useJobs";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Tabs } from "@/components/common/Tabs";
import { Icon } from "@iconify/react";
import { JobsTable } from "@/components/jobs/JobsTable";
import { JobsPagination } from "@/components/jobs/JobsPagination";
import { JobsSearchBar } from "@/components/jobs/JobsSearchBar";
import type { QueueListDTO } from "@/lib/generated-api";

type SortColumn =
  | "id"
  | "name"
  | "state"
  | "owner"
  | "node"
  | "cpuReserved"
  | "gpuReserved"
  | "memoryReserved"
  | "createdAt";

export function MachineDetailPage() {
  const { t } = useTranslation();
  const { machineId } = useParams<{ machineId: string }>();
  const { data, isLoading, error } = useMachineDetail(machineId || "");
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const [activeTab, setActiveTab] = useState("tasks");

  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLimit] = useState(20);
  const [jobsSort, setJobsSort] = useState<SortColumn>("createdAt");
  const [jobsOrder, setJobsOrder] = useState<"asc" | "desc">("desc");
  const [jobsSearch, setJobsSearch] = useState("");

  const nodeName =
    data?.type === "Node" && data.node && data.node.pbs
      ? data.node.pbs.name
      : null;

  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
  } = useJobs({
    page: jobsPage,
    limit: jobsLimit,
    sort: jobsSort,
    order: jobsOrder,
    search: jobsSearch.trim() || undefined,
    node: nodeName || undefined,
  });

  if (isLoading) {
    return (
      <>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-900">
              {t("pages.machineDetail")}
            </h1>
          </div>
        </header>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">{t("common.loading")}</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-900">
              {t("pages.machineDetail")}
            </h1>
          </div>
        </header>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              {t("common.errorLoading")}{" "}
              {error instanceof Error
                ? error.message
                : t("common.unknownError")}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data || data.type !== "Node" || !data.node) {
    return (
      <>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-900">
              {t("pages.machineDetail")}
            </h1>
          </div>
        </header>
        <div className="p-6">
          <div className="text-center text-gray-500 py-12">
            {t("machines.nodeNotFound")}
          </div>
        </div>
      </>
    );
  }

  const node = data.node as {
    name: string;
    cpu: number;
    pbs?: {
      name: string;
      actualState?: string | null;
      cpuUsagePercent?: number | null;
      gpuUsagePercent?: number | null;
      gpuCount?: number | null;
      gpuAssigned?: number | null;
      gpuCapability?: string | null;
      gpuMemory?: string | null;
      cudaVersion?: string | null;
      memoryTotal?: number | null;
      memoryUsed?: number | null;
      memoryUsagePercent?: number | null;
      jobs?: string[] | null;
      queues?: QueueListDTO[] | null;
      rawPbsAttributes?: Record<string, string> | null;
      outages?: Array<Record<string, any>> | null;
    } | null;
  };

  const getStateInfo = (
    state?: string | null
  ): { label: string; color: string } => {
    switch (state) {
      case "free":
        return {
          label: t("machines.nodeState.free"),
          color: "#22c55e",
        };
      case "partially_used":
        return {
          label: t("machines.nodeState.partiallyUsed"),
          color: "#86efac",
        };
      case "used":
        return {
          label: t("machines.nodeState.used"),
          color: "#3b82f6",
        };
      case "unknown":
      default:
        return {
          label: t("machines.nodeState.unknown"),
          color: "#eab308",
        };
    }
  };

  const getCpuUsagePercent = (): number => {
    if (!node.pbs) return 0;
    if (
      node.pbs.cpuUsagePercent === null ||
      node.pbs.cpuUsagePercent === undefined
    ) {
      return 0;
    }
    if (typeof node.pbs.cpuUsagePercent === "number") {
      return node.pbs.cpuUsagePercent;
    }
    return Number(node.pbs.cpuUsagePercent) || 0;
  };

  const getGpuUsagePercent = (): number | null => {
    if (!node.pbs) return null;
    if (
      node.pbs.gpuUsagePercent === null ||
      node.pbs.gpuUsagePercent === undefined
    ) {
      return null;
    }
    if (typeof node.pbs.gpuUsagePercent === "number") {
      return node.pbs.gpuUsagePercent;
    }
    return Number(node.pbs.gpuUsagePercent) || null;
  };

  const cpuUsage = getCpuUsagePercent();
  const gpuUsage = getGpuUsagePercent();
  const gpuCount =
    node.pbs &&
    node.pbs.gpuCount !== null &&
    node.pbs.gpuCount !== undefined &&
    typeof node.pbs.gpuCount === "number"
      ? node.pbs.gpuCount
      : null;
  const hasGpu = gpuUsage !== null || (gpuCount !== null && gpuCount > 0);

  const getCpuGpuColorClass = (percent: number): string => {
    if (percent <= 10) {
      return "#5D7085";
    } else if (percent < 95) {
      return "#5D7085";
    } else {
      return "#5D7085";
    }
  };

  const stateInfo = getStateInfo(node.pbs?.actualState);

  // Extract additional data from node
  const nodeQueues = Array.isArray(node.pbs?.queues)
    ? (node.pbs.queues as QueueListDTO[])
    : [];
  const rawAttributes =
    node.pbs?.rawPbsAttributes && typeof node.pbs.rawPbsAttributes === "object"
      ? (node.pbs.rawPbsAttributes as Record<string, string>)
      : null;
  const nodeOutages = Array.isArray(node.pbs?.outages) ? node.pbs.outages : [];

  const handleJobsSort = (column: SortColumn) => {
    if (jobsSort === column) {
      setJobsOrder(jobsOrder === "asc" ? "desc" : "asc");
    } else {
      setJobsSort(column);
      setJobsOrder("desc");
    }
    setJobsPage(1);
  };

  const handleJobsPageChange = (newPage: number) => {
    setJobsPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJobsSearchChange = (query: string) => {
    setJobsSearch(query);
    setJobsPage(1);
  };

  const jobsTotalPages = jobsData?.meta?.totalCount
    ? Math.ceil(jobsData.meta.totalCount / jobsLimit)
    : 0;

  // Tab content components
  const TasksTab = () => {
    // If no PBS data, show message
    if (!node.pbs) {
      return (
        <div className="px-6 py-4">
          <div className="text-gray-500">{t("machines.noPbsData")}</div>
        </div>
      );
    }

    return (
      <div>
        <JobsSearchBar
          searchQuery={jobsSearch}
          onSearchChange={handleJobsSearchChange}
          totalJobs={jobsData?.meta?.totalCount || 0}
        />

        {jobsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">{t("common.loading")}</div>
          </div>
        )}

        {jobsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="text-red-800">
              {t("common.errorLoading")}{" "}
              {jobsError instanceof Error
                ? jobsError.message
                : t("common.unknownError")}
            </div>
          </div>
        )}

        {jobsData && jobsData.data && (
          <>
            <JobsTable
              jobs={jobsData.data.jobs}
              sortColumn={jobsSort}
              sortDirection={jobsOrder}
              onSort={handleJobsSort}
              isAdmin={isAdmin}
              hideMachineColumn={true}
            />
            <JobsPagination
              currentPage={jobsPage}
              totalPages={jobsTotalPages}
              onPageChange={handleJobsPageChange}
            />
          </>
        )}

        {!jobsLoading &&
          !jobsError &&
          jobsData?.data &&
          jobsData.data.jobs.length === 0 && (
            <div className="text-gray-500">{t("machines.noJobs")}</div>
          )}
      </div>
    );
  };

  const QueuesTab = () => {
    const navigate = useNavigate();

    if (!node.pbs) {
      return (
        <div className="px-6 py-4">
          <div className="text-gray-500">{t("machines.noPbsData")}</div>
        </div>
      );
    }

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
                navigate(
                  `/queues/${queue.name}.${queue.server}.metacentrum.cz`
                );
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
                      <span className="text-gray-500">
                        {t("queues.queued")}
                      </span>
                      <span className="font-medium ml-2">{queuedJobs}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {t("queues.running")}
                      </span>
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
  };

  const SystemInfoTab = () => {
    if (!node.pbs) {
      return (
        <div className="px-6 py-4">
          <div className="text-gray-500">{t("machines.noPbsData")}</div>
        </div>
      );
    }

    return (
      <div className="px-6 py-4">
        {rawAttributes ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("machines.attribute")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("machines.value")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(rawAttributes)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                        {key}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 break-all">
                        {String(value)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500">{t("machines.noSystemInfo")}</div>
        )}
      </div>
    );
  };

  const OutagesTab = () => {
    if (!node.pbs) {
      return (
        <div className="px-6 py-4">
          <div className="text-gray-500">{t("machines.noPbsData")}</div>
        </div>
      );
    }

    return (
      <div className="px-6 py-4">
        {nodeOutages.length === 0 ? (
          <div className="text-gray-500">{t("machines.noOutages")}</div>
        ) : (
          <div className="space-y-4">
            {nodeOutages.map((outage, index) => (
              <div
                key={index}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded"
              >
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(outage, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    {
      id: "tasks",
      label: t("machines.tabs.tasks"),
      content: <TasksTab />,
    },
    {
      id: "queues",
      label: t("machines.tabs.queues"),
      content: <QueuesTab />,
    },
    {
      id: "system",
      label: t("machines.tabs.systemInfo"),
      content: <SystemInfoTab />,
    },
    {
      id: "outages",
      label: t("machines.tabs.outages"),
      content: <OutagesTab />,
    },
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-900">
            {t("pages.machineDetail")}: {node.name}
          </h1>
        </div>
      </header>
      <div className="p-6 space-y-6">
        {/* Basic Information from PERUN (always present) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("machines.basicInformation")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">
                  {t("machines.nodeName")}
                </div>
                <div className="text-lg font-medium text-gray-900">
                  {node.name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {t("machines.totalCpu")}
                </div>
                <div className="text-lg font-medium text-gray-900">
                  {node.cpu}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Usage from PBS (can be null) */}
        {node.pbs &&
          (cpuUsage > 0 ||
            gpuUsage !== null ||
            node.pbs.memoryUsagePercent !== null) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("machines.resourceUsage")}
                </h2>
                <div className="space-y-4">
                  {cpuUsage > 0 && (
                    <ProgressBar
                      label="CPU"
                      value={node.cpu}
                      percent={cpuUsage}
                      color={getCpuGpuColorClass}
                      icon={
                        <Icon
                          icon="solar:cpu-bold"
                          className="w-[14px] h-[14px]"
                        />
                      }
                    />
                  )}

                  {hasGpu && (
                    <ProgressBar
                      label="GPU"
                      value={
                        gpuCount !== null
                          ? `${
                              node.pbs.gpuAssigned &&
                              typeof node.pbs.gpuAssigned === "number"
                                ? node.pbs.gpuAssigned
                                : 0
                            } / ${gpuCount}`
                          : "GPU"
                      }
                      percent={gpuUsage !== null ? gpuUsage : 0}
                      color={getCpuGpuColorClass}
                      icon={
                        <Icon
                          icon="solar:gpu-bold"
                          className="w-[14px] h-[14px]"
                        />
                      }
                    />
                  )}

                  {node.pbs.memoryUsagePercent !== null &&
                    node.pbs.memoryUsagePercent !== undefined &&
                    node.pbs.memoryTotal !== null &&
                    node.pbs.memoryUsed !== null &&
                    typeof node.pbs.memoryTotal === "number" &&
                    typeof node.pbs.memoryUsed === "number" &&
                    typeof node.pbs.memoryUsagePercent === "number" && (
                      <ProgressBar
                        label="RAM"
                        value={`${Number(node.pbs.memoryUsed).toFixed(1)} / ${Number(node.pbs.memoryTotal).toFixed(1)} (GB)`}
                        percent={Number(node.pbs.memoryUsagePercent)}
                        color="#5D7085"
                      />
                    )}
                </div>
                {node.pbs.actualState && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">
                      {t("machines.state")}
                    </div>
                    <div
                      className="text-lg font-medium"
                      style={{ color: stateInfo.color }}
                    >
                      {stateInfo.label}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Tabs Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </>
  );
}
