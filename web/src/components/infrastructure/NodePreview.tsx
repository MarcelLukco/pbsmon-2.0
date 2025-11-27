import type { InfrastructureNodeListDTO } from "@/lib/generated-api";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

interface NodePreviewProps {
  node: InfrastructureNodeListDTO;
}

export function NodePreview({ node }: NodePreviewProps) {
  const { t } = useTranslation();

  // Map state to translation key and get color
  const getStateInfo = (
    state?: string | null
  ): { label: string; color: string } => {
    switch (state) {
      case "free":
        return {
          label: t("machines.nodeState.free"),
          color: "#22c55e", // green
        };
      case "partially_used":
        return {
          label: t("machines.nodeState.partiallyUsed"),
          color: "#86efac", // light green
        };
      case "used":
        return {
          label: t("machines.nodeState.used"),
          color: "#3b82f6", // blue
        };
      case "unknown":
      default:
        return {
          label: t("machines.nodeState.unknown"),
          color: "#eab308", // yellow
        };
    }
  };

  // Parse CPU usage percentage
  const getCpuUsagePercent = (): number => {
    if (node.cpuUsagePercent === null || node.cpuUsagePercent === undefined) {
      return 0;
    }
    if (typeof node.cpuUsagePercent === "number") {
      return node.cpuUsagePercent;
    }
    return Number(node.cpuUsagePercent) || 0;
  };

  // Parse GPU usage percentage
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

  // Color class function for CPU/GPU
  // Ensure Tailwind detects these classes by listing them as complete strings
  // This comment helps Tailwind JIT scanner: bg-green-500 bg-primary bg-blue-500 border-green-500 border-primary border-blue-500 text-green-500 text-primary text-blue-500
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
    <div className="px-4 py-3  rounded-lg border border-gray-200 shadow-sm ">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{node.name}</h3>
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
