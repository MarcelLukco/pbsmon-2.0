import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Tabs } from "@/components/common/Tabs";
import { Icon } from "@iconify/react";
import { MachinePbsTasksTab } from "@/components/infrastructure/MachinePbsTasksTab";
import { MachinePbsQueuesTab } from "@/components/infrastructure/MachinePbsQueuesTab";
import { MachinePbsSystemInfoTab } from "@/components/infrastructure/MachinePbsSystemInfoTab";
import { MachinePbsOutagesTab } from "@/components/infrastructure/MachinePbsOutagesTab";
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

interface MachineDetailContentProps {
  node: {
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
}

export function MachineDetailContent({ node }: MachineDetailContentProps) {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  const [activeTab, setActiveTab] = useState("tasks");

  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLimit] = useState(20);
  const [jobsSort, setJobsSort] = useState<SortColumn>("createdAt");
  const [jobsOrder, setJobsOrder] = useState<"asc" | "desc">("desc");
  const [jobsSearch, setJobsSearch] = useState("");

  const nodeName = node.pbs ? node.pbs.name : null;

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
      case "maintenance":
        return {
          label: t("machines.nodeState.maintenance") || "Maintenance",
          color: "#f59e0b",
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
  const isMaintenance = node.pbs?.actualState === "maintenance";

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

  const tabs = node.pbs
    ? [
        {
          id: "tasks",
          label: t("machines.tabs.tasks"),
          content: (
            <MachinePbsTasksTab
              nodeName={nodeName}
              isAdmin={isAdmin}
              jobsPage={jobsPage}
              jobsLimit={jobsLimit}
              jobsSort={jobsSort}
              jobsOrder={jobsOrder}
              jobsSearch={jobsSearch}
              onJobsPageChange={handleJobsPageChange}
              onJobsSort={handleJobsSort}
              onJobsSearchChange={handleJobsSearchChange}
            />
          ),
        },
        {
          id: "queues",
          label: t("machines.tabs.queues"),
          content: <MachinePbsQueuesTab nodeQueues={nodeQueues} />,
        },
        {
          id: "system",
          label: t("machines.tabs.systemInfo"),
          content: <MachinePbsSystemInfoTab rawAttributes={rawAttributes} />,
        },
        {
          id: "outages",
          label: t("machines.tabs.outages"),
          content: <MachinePbsOutagesTab nodeOutages={nodeOutages} />,
        },
      ]
    : [];

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
          !isMaintenance &&
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

        {/* Show state only (no progress bars) when in maintenance */}
        {node.pbs && isMaintenance && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("machines.resourceUsage")}
              </h2>
              {node.pbs.actualState && (
                <div>
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

        {/* Tabs Section - Only show if PBS data exists */}
        {node.pbs && tabs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
