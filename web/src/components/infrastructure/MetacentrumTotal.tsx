import { useTranslation } from "react-i18next";
import type { MetaDto } from "@/lib/generated-api";

// Infrastructure meta extends MetaDto with additional fields
type InfrastructureListMetaDto = MetaDto & {
  totalOrganizations: number;
  totalClusters: number;
  totalNodes: number;
  totalCpu: number;
  totalGpu?: number | null;
  totalMemory?: number | null;
  freeNodes: number;
  partiallyUsedNodes: number;
  usedNodes: number;
  unknownNodes: number;
};

interface MetacentrumTotalProps {
  meta: InfrastructureListMetaDto;
}

export function MetacentrumTotal({ meta }: MetacentrumTotalProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-primary-900 mb-4">
        {t("machines.metacentrumTotal")}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-gray-600">
            {t("machines.totalOrganizations")}
          </div>
          <div className="text-2xl font-bold text-primary-900">
            {meta.totalOrganizations}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">
            {t("machines.totalClusters")}
          </div>
          <div className="text-2xl font-bold text-primary-900">
            {meta.totalClusters}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">
            {t("machines.totalNodes")}
          </div>
          <div className="text-2xl font-bold text-primary-900">
            {meta.totalNodes}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">{t("machines.totalCpu")}</div>
          <div className="text-2xl font-bold text-primary-900">
            {meta.totalCpu}
          </div>
        </div>
        {meta.totalGpu !== null && meta.totalGpu !== undefined && (
          <div>
            <div className="text-sm text-gray-600">
              {t("machines.totalGpu")}
            </div>
            <div className="text-2xl font-bold text-primary-900">
              {meta.totalGpu}
            </div>
          </div>
        )}
        <div>
          <div className="text-sm text-gray-600">{t("machines.freeNodes")}</div>
          <div className="text-2xl font-bold text-green-600">
            {meta.freeNodes}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">
            {t("machines.partiallyUsedNodes")}
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {meta.partiallyUsedNodes}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600">{t("machines.usedNodes")}</div>
          <div className="text-2xl font-bold text-red-600">
            {meta.usedNodes}
          </div>
        </div>
      </div>
    </div>
  );
}
