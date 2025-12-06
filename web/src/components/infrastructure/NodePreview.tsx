import type { InfrastructureNodeListDTO } from "@/lib/generated-api";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface NodePreviewProps {
  node: InfrastructureNodeListDTO;
  clusterName: string;
}

export function NodePreview({ node, clusterName }: NodePreviewProps) {
  const { t } = useTranslation();

  const getShortNodeName = (nodeName: string, clusterName: string): string => {
    if (nodeName.endsWith(`.${clusterName}`)) {
      const prefix = nodeName.slice(
        0,
        nodeName.length - clusterName.length - 1
      );
      return prefix;
    }
    if (nodeName === clusterName) {
      return nodeName;
    }
    const nodeParts = nodeName.split(".");
    const clusterParts = clusterName.split(".");

    for (let i = 0; i < nodeParts.length; i++) {
      if (i >= clusterParts.length || nodeParts[i] !== clusterParts[i]) {
        return nodeParts.slice(0, i + 1).join(".");
      }
    }

    return nodeParts[0] || nodeName;
  };

  const shortNodeName = getShortNodeName(node.name, clusterName);

  const getStateInfo = (
    state?: string | null
  ): { label: string; color: string } | null => {
    if (!state) {
      return null; // No PBS detected - no state to show
    }
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
    if (node.cpuUsagePercent === null || node.cpuUsagePercent === undefined) {
      return 0;
    }
    if (typeof node.cpuUsagePercent === "number") {
      return node.cpuUsagePercent;
    }
    return Number(node.cpuUsagePercent) || 0;
  };

  const getGpuUsagePercent = (): number | null => {
    if (node.gpuUsagePercent === null || node.gpuUsagePercent === undefined) {
      return null;
    }
    if (typeof node.gpuUsagePercent === "number") {
      return node.gpuUsagePercent;
    }
    return Number(node.gpuUsagePercent) || null;
  };

  const cpuUsage = getCpuUsagePercent();
  const gpuUsage = getGpuUsagePercent();
  const gpuCount =
    node.gpuCount !== null &&
    node.gpuCount !== undefined &&
    typeof node.gpuCount === "number"
      ? node.gpuCount
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

  const stateInfo = getStateInfo(node.actualState);
  const isMaintenance = node.actualState === "maintenance";
  const hasPbs = node.actualState !== null && node.actualState !== undefined;
  const shouldShowProgressBars = hasPbs && !isMaintenance;

  const formatMemory = (gb: number): string => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)}TB`;
    }
    return `${gb.toFixed(0)}GB`;
  };

  return (
    <Link
      to={`/machines/${encodeURIComponent(node.name)}`}
      className="relative px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-primary-500 hover:shadow-md transition-all block w-full"
    >
      <div className="mb-3 sm:mb-4">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate flex-1 min-w-0 pr-2">
            {shortNodeName}
          </h3>
          {stateInfo && (
            <span
              className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0"
              style={{ backgroundColor: stateInfo.color }}
            >
              {stateInfo.label}
            </span>
          )}
        </div>
      </div>

      {isMaintenance ? (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2 ">
            <span>CPU </span>
            <span className="flex items-center gap-2">
              <span>{node.cpu}</span>
              <Icon icon="solar:cpu-bold" className="w-4 h-4 flex-shrink-0" />
            </span>
          </div>
          {node.memoryTotal !== null &&
            typeof node.memoryTotal === "number" && (
              <div className="flex items-center justify-between gap-2">
                <span>RAM </span>
                <span className="flex items-center gap-2">
                  <span>{formatMemory(node.memoryTotal)}</span>
                  <Icon icon="ph:memory" className="w-4 h-4 flex-shrink-0" />
                </span>
              </div>
            )}
          {hasGpu && gpuCount !== null && (
            <div className="flex items-center justify-between gap-2">
              <span>GPU </span>
              <span className="flex items-center gap-2">
                <span>{gpuCount}</span>
                <Icon icon="solar:gpu-bold" className="w-4 h-4 flex-shrink-0" />
              </span>
            </div>
          )}
        </div>
      ) : (
        shouldShowProgressBars && (
          <div className="space-y-2 sm:space-y-3">
            <ProgressBar
              label="CPU"
              value={
                (node as any).cpuAssigned !== null &&
                (node as any).cpuAssigned !== undefined &&
                typeof (node as any).cpuAssigned === "number"
                  ? `${(node as any).cpuAssigned} / ${node.cpu}`
                  : node.cpu
              }
              percent={cpuUsage}
              color={getCpuGpuColorClass}
              icon={
                <Icon icon="solar:cpu-bold" className="w-[14px] h-[14px]" />
              }
            />

            {hasGpu && (
              <div>
                <ProgressBar
                  label="GPU"
                  value={
                    gpuCount !== null
                      ? `${
                          node.gpuAssigned &&
                          typeof node.gpuAssigned === "number"
                            ? node.gpuAssigned
                            : 0
                        } / ${gpuCount}`
                      : "GPU"
                  }
                  percent={gpuUsage !== null ? gpuUsage : 0}
                  color={getCpuGpuColorClass}
                  icon={
                    <Icon icon="solar:gpu-bold" className="w-[14px] h-[14px]" />
                  }
                />
              </div>
            )}

            {node.memoryUsagePercent !== null &&
              node.memoryUsagePercent !== undefined &&
              node.memoryTotal !== null &&
              node.memoryUsed !== null &&
              typeof node.memoryTotal === "number" &&
              typeof node.memoryUsed === "number" &&
              typeof node.memoryUsagePercent === "number" && (
                <ProgressBar
                  label="RAM"
                  value={`${Number(node.memoryUsed).toFixed(1)} / ${Number(node.memoryTotal).toFixed(1)} (GB)`}
                  percent={Number(node.memoryUsagePercent)}
                  color="#5D7085"
                />
              )}
          </div>
        )
      )}
    </Link>
  );
}
