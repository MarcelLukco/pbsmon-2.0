import { useTranslation } from "react-i18next";
import type { InfrastructureClusterListDTO } from "@/lib/generated-api";
import { NodePreview } from "./NodePreview";

interface ClusterPreviewProps {
  cluster: InfrastructureClusterListDTO;
}

export function ClusterPreview({ cluster }: ClusterPreviewProps) {
  const { t } = useTranslation();

  return (
    <div
      id={`cluster-${cluster.id}`}
      className="mb-6 last:mb-0 border-l-2 border-primary-200 pl-4"
    >
      {/* Cluster Header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-primary-800 mb-2">
          {cluster.name}
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({cluster.totalCpu} {t("machines.totalCpu")})
          </span>
        </h3>
      </div>

      {/* Nodes */}
      <div className="flex flex-wrap gap-2">
        {cluster.nodes.map((node) => (
          <NodePreview key={node.name} node={node} />
        ))}
      </div>
    </div>
  );
}
