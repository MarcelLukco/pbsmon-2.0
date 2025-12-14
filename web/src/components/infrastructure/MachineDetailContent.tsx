import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Tabs } from "@/components/common/Tabs";
import { Icon } from "@iconify/react";
import { MachinePbsTasksTab } from "@/components/infrastructure/MachinePbsTasksTab";
import { MachinePbsQueuesTab } from "@/components/infrastructure/MachinePbsQueuesTab";
import { MachinePbsSystemInfoTab } from "@/components/infrastructure/MachinePbsSystemInfoTab";
import { MachinePbsOutagesTab } from "@/components/infrastructure/MachinePbsOutagesTab";
import type {
  QueueListDTO,
  InfrastructureDetailDTO,
} from "@/lib/generated-api";

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
  node: NonNullable<InfrastructureDetailDTO["node"]>;
}

export function MachineDetailContent({ node }: MachineDetailContentProps) {
  const { t } = useTranslation();
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
      case "not-available":
        return {
          label: t("machines.nodeState.notAvailable") || "Not Available",
          color: "#ef4444",
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
          content: <MachinePbsOutagesTab nodeName={nodeName} />,
        },
      ]
    : [];

  // Extract comments for error banner
  const comment = node.pbs?.comment || null;
  const commentAux = node.pbs?.commentAux || null;
  const hasComments = comment || commentAux;

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
        {/* Error Banner - Show comments at the top */}
        {hasComments && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Icon
                icon="mdi:alert-circle"
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  {t("machines.errorMessages") || "Error Messages"}
                </h3>
                {comment && (
                  <div className="text-sm text-red-700 mb-2">{comment}</div>
                )}
                {commentAux && (
                  <div className="text-sm text-red-700">{commentAux}</div>
                )}
              </div>
            </div>
          </div>
        )}
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
                <div className="flex items-center gap-3">
                  <div className="text-lg font-medium text-gray-900">
                    {node.name}
                  </div>
                  {node.pbs?.actualState && (
                    <div
                      className="text-sm font-medium px-2 py-1 rounded"
                      style={{
                        color: stateInfo.color,
                        backgroundColor: `${stateInfo.color}20`,
                      }}
                    >
                      {stateInfo.label}
                    </div>
                  )}
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
              {node.clusterName && (
                <div>
                  <div className="text-sm text-gray-500">
                    {t("machines.clusterName")}
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {i18n.language === "cs"
                      ? node.clusterName.cs
                      : node.clusterName.en}
                  </div>
                </div>
              )}
              {node.owner && (
                <div>
                  <div className="text-sm text-gray-500">
                    {t("machines.owner")}
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {i18n.language === "cs" ? node.owner.cs : node.owner.en}
                  </div>
                </div>
              )}
              {/* Cloud Node Information */}
              {node.ostack !== null && node.ostack !== undefined && (
                <>
                  <div className="col-span-2 pt-2 mt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon
                        icon="mdi:cloud"
                        className="w-5 h-5 text-gray-500"
                      />
                      <h3 className="text-sm font-semibold text-gray-700">
                        {t("machines.cloudNode") || "Cloud Node Information"}
                      </h3>
                    </div>
                  </div>
                  {node.ostack.cpuCount !== null &&
                    node.ostack.cpuCount !== undefined && (
                      <div>
                        <div className="text-sm text-gray-500">
                          {t("machines.cloudCpu") || "Cloud CPU Count"}
                        </div>
                        <div className="text-lg font-medium text-gray-900">
                          {node.ostack.cpuCount}
                        </div>
                      </div>
                    )}
                  {node.ostack.vmCount !== null &&
                    node.ostack.vmCount !== undefined && (
                      <div>
                        <div className="text-sm text-gray-500">
                          {t("machines.vmCount") || "VM Count"}
                        </div>
                        <div className="text-lg font-medium text-gray-900">
                          {node.ostack.vmCount}
                        </div>
                      </div>
                    )}
                  {node.ostack.cpuModel && (
                    <div>
                      <div className="text-sm text-gray-500">
                        {t("machines.cpuModel") || "CPU Model"}
                      </div>
                      <div className="text-lg font-medium text-gray-900">
                        {node.ostack.cpuModel}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reserved Resources from PBS (can be null) */}
        {node.pbs &&
          !isMaintenance &&
          (cpuUsage > 0 ||
            gpuUsage !== null ||
            node.pbs.memoryUsagePercent !== null) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("machines.reservedResources")}
                </h2>
                <div className="space-y-4">
                  {cpuUsage > 0 && (
                    <ProgressBar
                      label="CPU"
                      value={
                        node.pbs.cpuAssigned !== null &&
                        node.pbs.cpuAssigned !== undefined
                          ? `${node.pbs.cpuAssigned} / ${node.cpu}`
                          : `${node.cpu}`
                      }
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
              </div>
            </div>
          )}

        {/* Show reserved resources section when in maintenance */}
        {node.pbs && isMaintenance && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("machines.reservedResources")}
              </h2>
              <div className="text-sm text-gray-500">
                {t("machines.nodeState.maintenance")}
              </div>
            </div>
          </div>
        )}

        {/* Reservation Information */}
        {node.pbs?.reservation && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Icon
                  icon={
                    node.pbs.reservation.isStarted
                      ? "mdi:calendar-clock"
                      : "mdi:calendar-clock-outline"
                  }
                  className={`w-6 h-6 ${
                    node.pbs.reservation.isStarted
                      ? "text-purple-600"
                      : "text-orange-600"
                  }`}
                />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("machines.reservation")}
                </h2>
                <div
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    node.pbs.reservation.isStarted
                      ? "bg-purple-100 text-purple-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {node.pbs.reservation.isStarted
                    ? t("machines.reservationStarted")
                    : t("machines.reservationNotStarted")}
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {node.pbs.reservation.displayName &&
                    typeof node.pbs.reservation.displayName === "string" && (
                      <div>
                        <div className="text-sm text-gray-500">
                          {t("machines.reservationName")}
                        </div>
                        <div className="text-lg font-medium text-gray-900">
                          {node.pbs.reservation.displayName}
                        </div>
                      </div>
                    )}
                  {node.pbs.reservation.owner &&
                    typeof node.pbs.reservation.owner === "string" && (
                      <div>
                        <div className="text-sm text-gray-500">
                          {t("machines.reservationOwner")}
                        </div>
                        <div className="text-lg font-medium text-gray-900">
                          {node.pbs.reservation.canSeeOwner ? (
                            <Link
                              to={`/users/${encodeURIComponent(
                                node.pbs.reservation.owner.split("@")[0]
                              )}`}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              {node.pbs.reservation.owner.split("@")[0]}
                            </Link>
                          ) : (
                            <span>{t("jobs.anonym")}</span>
                          )}
                        </div>
                      </div>
                    )}
                  {node.pbs.reservation.startTime &&
                    typeof node.pbs.reservation.startTime === "number" && (
                      <div>
                        <div className="text-sm text-gray-500">
                          {t("machines.reservationStart")}
                        </div>
                        <div className="text-lg font-medium text-gray-900">
                          {(() => {
                            const date = new Date(
                              node.pbs.reservation.startTime * 1000
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const year = date.getFullYear();
                            const hours = String(date.getHours()).padStart(
                              2,
                              "0"
                            );
                            const minutes = String(date.getMinutes()).padStart(
                              2,
                              "0"
                            );
                            const seconds = String(date.getSeconds()).padStart(
                              2,
                              "0"
                            );
                            return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
                          })()}
                        </div>
                      </div>
                    )}
                  {node.pbs.reservation.endTime &&
                    typeof node.pbs.reservation.endTime === "number" && (
                      <div>
                        <div className="text-sm text-gray-500">
                          {t("machines.reservationEnd")}
                        </div>
                        <div className="text-lg font-medium text-gray-900">
                          {(() => {
                            const date = new Date(
                              node.pbs.reservation.endTime * 1000
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const year = date.getFullYear();
                            const hours = String(date.getHours()).padStart(
                              2,
                              "0"
                            );
                            const minutes = String(date.getMinutes()).padStart(
                              2,
                              "0"
                            );
                            const seconds = String(date.getSeconds()).padStart(
                              2,
                              "0"
                            );
                            return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
                          })()}
                        </div>
                      </div>
                    )}
                </div>
                {(node.pbs.reservation.resourceMem ||
                  node.pbs.reservation.resourceNcpus ||
                  node.pbs.reservation.resourceNgpus ||
                  node.pbs.reservation.resourceNodect) && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">
                      {t("machines.reservationResources")}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {node.pbs.reservation.resourceMem &&
                        typeof node.pbs.reservation.resourceMem ===
                          "string" && (
                          <div>
                            <div className="text-xs text-gray-500">
                              {t("machines.memory")}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {node.pbs.reservation.resourceMem}
                            </div>
                          </div>
                        )}
                      {node.pbs.reservation.resourceNcpus &&
                        typeof node.pbs.reservation.resourceNcpus ===
                          "string" && (
                          <div>
                            <div className="text-xs text-gray-500">
                              {t("machines.cpus")}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {node.pbs.reservation.resourceNcpus}
                            </div>
                          </div>
                        )}
                      {node.pbs.reservation.resourceNgpus &&
                        typeof node.pbs.reservation.resourceNgpus ===
                          "string" && (
                          <div>
                            <div className="text-xs text-gray-500">
                              {t("machines.gpus")}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {node.pbs.reservation.resourceNgpus}
                            </div>
                          </div>
                        )}
                      {node.pbs.reservation.resourceNodect &&
                        typeof node.pbs.reservation.resourceNodect ===
                          "string" && (
                          <div>
                            <div className="text-xs text-gray-500">
                              {t("machines.nodes")}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {node.pbs.reservation.resourceNodect}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}
                {node.pbs.reservation.queue &&
                  typeof node.pbs.reservation.queue === "string" && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        {t("machines.reservationQueue")}
                      </div>
                      <div>
                        <Link
                          to={`/queues/${node.pbs.reservation.queue}${
                            node.pbs.reservation.queue.includes("@")
                              ? ""
                              : "@pbs-m1.metacentrum.cz"
                          }`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {node.pbs.reservation.queue}
                        </Link>
                      </div>
                    </div>
                  )}
                {node.pbs.reservation.authorizedUsers &&
                  Array.isArray(node.pbs.reservation.authorizedUsers) &&
                  node.pbs.reservation.authorizedUsers.length > 0 &&
                  node.pbs.reservation.hasAccess === true && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        {t("machines.reservationAuthorizedUsers")}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {node.pbs.reservation.authorizedUsers.map(
                          (user: any, index: number) => {
                            // Handle both old format (string) and new format (object)
                            const username =
                              typeof user === "string"
                                ? user.split("@")[0]
                                : user.username;
                            const hasAccess =
                              typeof user === "string"
                                ? false
                                : user.hasAccess === true;
                            const key =
                              typeof user === "string"
                                ? user
                                : `${user.username}-${index}`;

                            if (hasAccess) {
                              return (
                                <Link
                                  key={key}
                                  to={`/users/${encodeURIComponent(username)}`}
                                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 hover:text-primary-800"
                                >
                                  {username}
                                </Link>
                              );
                            } else {
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md"
                                >
                                  <Icon
                                    icon="bxs:lock"
                                    className="w-4 h-4 mr-1"
                                  />
                                  {username}
                                </span>
                              );
                            }
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Scratch Space Information */}
        {node.pbs &&
          (node.pbs.scratchLocalTotal !== null ||
            node.pbs.scratchSsdTotal !== null ||
            node.pbs.scratchSharedTotal !== null ||
            node.pbs.scratchShmAvailable === true) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("machines.scratchSpace") || "Scratch Space"}
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                {/* Scratch Local */}
                {node.pbs.scratchLocalTotal !== null &&
                  node.pbs.scratchLocalTotal > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">
                          {t("machines.scratchLocal") || "Scratch Local"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {node.pbs.scratchLocalAvailable !== null
                            ? `${node.pbs.scratchLocalAvailable.toFixed(1)} GB ${t("machines.available") || "available"}`
                            : ""}
                          {node.pbs.scratchLocalUsed !== null &&
                            node.pbs.scratchLocalTotal !== null &&
                            ` / ${node.pbs.scratchLocalTotal.toFixed(1)} GB`}
                        </div>
                      </div>
                      {node.pbs.scratchLocalTotal !== null &&
                        node.pbs.scratchLocalUsed !== null && (
                          <ProgressBar
                            label=""
                            value=""
                            percent={
                              (node.pbs.scratchLocalUsed /
                                node.pbs.scratchLocalTotal) *
                              100
                            }
                            color="#5D7085"
                          />
                        )}
                    </div>
                  )}

                {/* Scratch SSD */}
                {node.pbs.scratchSsdTotal !== null &&
                  node.pbs.scratchSsdTotal > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">
                          {t("machines.scratchSsd") || "Scratch SSD"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {node.pbs.scratchSsdAvailable !== null
                            ? `${node.pbs.scratchSsdAvailable.toFixed(1)} GB ${t("machines.available") || "available"}`
                            : ""}
                          {node.pbs.scratchSsdUsed !== null &&
                            node.pbs.scratchSsdTotal !== null &&
                            ` / ${node.pbs.scratchSsdTotal.toFixed(1)} GB`}
                        </div>
                      </div>
                      {node.pbs.scratchSsdTotal !== null &&
                        node.pbs.scratchSsdUsed !== null && (
                          <ProgressBar
                            label=""
                            value=""
                            percent={
                              (node.pbs.scratchSsdUsed /
                                node.pbs.scratchSsdTotal) *
                              100
                            }
                            color="#5D7085"
                          />
                        )}
                    </div>
                  )}

                {/* Scratch Shared */}
                {node.pbs.scratchSharedTotal !== null &&
                  node.pbs.scratchSharedTotal > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">
                          {t("machines.scratchShared") || "Scratch Shared"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {node.pbs.scratchSharedTotal.toFixed(1)} GB
                        </div>
                      </div>
                    </div>
                  )}

                {/* Scratch SHM */}
                {node.pbs.scratchShmAvailable === true && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">
                        {t("machines.scratchShm") || "Scratch SHM"}
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        {t("machines.available") || "Available"}
                      </div>
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
