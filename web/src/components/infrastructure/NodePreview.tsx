import type { InfrastructureNodeListDTO } from "@/lib/generated-api";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface NodePreviewProps {
  node: InfrastructureNodeListDTO;
  clusterName: string;
}

export function NodePreview({ node, clusterName }: NodePreviewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

  const handleClick = () => {
    navigate(`/machines/${encodeURIComponent(node.name)}`);
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

  return (
    <div
      className="px-4 py-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-primary-500 hover:shadow-md transition-all"
      onClick={handleClick}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">{shortNodeName}</h3>
        <p className="font-medium" style={{ color: stateInfo.color }}>
          ({stateInfo.label})
        </p>
      </div>

      <div className="space-y-3">
        <ProgressBar
          label="CPU"
          value={node.cpu}
          percent={cpuUsage}
          color={getCpuGpuColorClass}
          icon={<Icon icon="solar:cpu-bold" className="w-[14px] h-[14px]" />}
        />

        {hasGpu && (
          <div>
            <ProgressBar
              label="GPU"
              value={
                gpuCount !== null
                  ? `${
                      node.gpuAssigned && typeof node.gpuAssigned === "number"
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
    </div>
  );
}
