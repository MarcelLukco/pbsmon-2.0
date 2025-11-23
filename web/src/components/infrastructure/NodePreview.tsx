import { useTranslation } from "react-i18next";
import type { InfrastructureNodeListDTO } from "@/hooks/useInfrastructure";

interface NodePreviewProps {
  node: InfrastructureNodeListDTO;
}

export function NodePreview({ node }: NodePreviewProps) {
  const { t } = useTranslation();

  const getNodeStateColor = (state?: string | null) => {
    switch (state) {
      case "free":
        return "bg-green-100 text-green-800";
      case "partially_used":
        return "bg-yellow-100 text-yellow-800";
      case "used":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNodeStateLabel = (state?: string | null) => {
    switch (state) {
      case "free":
        return t("machines.nodeState.free");
      case "partially_used":
        return t("machines.nodeState.partiallyUsed");
      case "used":
        return t("machines.nodeState.used");
      default:
        return t("machines.nodeState.unknown");
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
      <span className="font-medium text-gray-900">{node.name}</span>
      <span className="text-sm text-gray-600">
        ({node.cpu} CPU
        {node.cpuUsagePercent !== null &&
          node.cpuUsagePercent !== undefined && (
            <span className="ml-1">- {node.cpuUsagePercent}%</span>
          )}
        )
      </span>
      {node.actualState && (
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${getNodeStateColor(
            node.actualState
          )}`}
        >
          {getNodeStateLabel(node.actualState)}
        </span>
      )}
    </div>
  );
}
