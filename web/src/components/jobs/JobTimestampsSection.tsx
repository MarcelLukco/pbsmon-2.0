import { useTranslation } from "react-i18next";
import type { JobDetailDTO } from "@/lib/generated-api";

interface JobTimestampsSectionProps {
  job: JobDetailDTO;
}

export function JobTimestampsSection({ job }: JobTimestampsSectionProps) {
  const { t } = useTranslation();

  const formatTimestamp = (
    timestamp: number | null | undefined | Record<string, any>
  ): string => {
    if (!timestamp || typeof timestamp !== "number") return "-";
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("jobs.timestamps")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">{t("jobs.createdAt")}</div>
          <div className="text-sm text-gray-900">
            {formatTimestamp(job.createdAt)}
          </div>
        </div>
        {job.eligibleAt && (
          <div>
            <div className="text-sm text-gray-500">{t("jobs.eligibleAt")}</div>
            <div className="text-sm text-gray-900">
              {formatTimestamp(job.eligibleAt)}
            </div>
          </div>
        )}
        {job.startedAt && (
          <div>
            <div className="text-sm text-gray-500">{t("jobs.startedAt")}</div>
            <div className="text-sm text-gray-900">
              {formatTimestamp(job.startedAt)}
            </div>
          </div>
        )}
        {job.lastStateChangeAt && (
          <div>
            <div className="text-sm text-gray-500">
              {t("jobs.lastStateChangeAt")}
            </div>
            <div className="text-sm text-gray-900">
              {formatTimestamp(job.lastStateChangeAt)}
            </div>
          </div>
        )}
        {job.kerberosTicketAt && (
          <div>
            <div className="text-sm text-gray-500">
              {t("jobs.kerberosTicketAt")}
            </div>
            <div className="text-sm text-gray-900">
              {formatTimestamp(job.kerberosTicketAt)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

