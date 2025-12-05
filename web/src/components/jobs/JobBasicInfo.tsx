import { useTranslation } from "react-i18next";
import type { JobDetailDTO } from "@/lib/generated-api";
import { Link } from "react-router-dom";

interface JobBasicInfoProps {
  job: JobDetailDTO;
}

export function JobBasicInfo({ job }: JobBasicInfoProps) {
  const { t } = useTranslation();

  const stateName = String((job as any).stateName || job.state || "");
  const stateColor = String(
    (job as any).stateColor || "bg-gray-100 text-gray-800"
  );
  const stateLabel = String(
    t(`jobs.state.${stateName}`, { default: stateName })
  );

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("jobs.basicInfo")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">{t("jobs.jobId")}</div>
          <div className="text-lg font-medium text-gray-900 font-mono">
            {job.id}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">{t("jobs.jobName")}</div>
          <div className="text-lg font-medium text-gray-900">{job.name}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">{t("jobs.stateLabel")}</div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stateColor}`}
            >
              {stateLabel}
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">{t("jobs.owner")}</div>
          <div className="text-lg font-medium text-gray-900">
            <Link
              to={`/users/${String(job.username || "")}`}
              className="text-primary-600 hover:text-primary-800"
            >
              {String(job.owner || "")}
            </Link>
          </div>
        </div>
        {job.queue && (
          <div>
            <div className="text-sm text-gray-500">{t("jobs.queue")}</div>
            <div className="text-lg font-medium text-gray-900">
              <Link
                to={`/queues/${job.queue}`}
                className="text-primary-600 hover:text-primary-800"
              >
                {String(job.queue)}@{String(job.server)}
              </Link>
            </div>
          </div>
        )}
        {job.server && (
          <div>
            <div className="text-sm text-gray-500">{t("jobs.server")}</div>
            <div className="text-lg font-medium text-gray-900">
              {String(job.server)}
            </div>
          </div>
        )}
        {job.node && (
          <div>
            <div className="text-sm text-gray-500">{t("jobs.node")}</div>
            <div className="text-lg font-medium text-gray-900">
              <Link
                to={`/machines/${String(job.node)}`}
                className="text-primary-600 hover:text-primary-800"
              >
                {String(job.node)}
              </Link>
            </div>
          </div>
        )}
        {typeof job.exitCode === "number" &&
          job.exitCode !== null &&
          job.exitCode !== undefined && (
            <div>
              <div className="text-sm text-gray-500">{t("jobs.exitCode")}</div>
              <div
                className={`text-lg font-medium ${
                  job.exitCode === 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {job.exitCode}
              </div>
            </div>
          )}
      </div>
      {job.comment && (
        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-1">{t("jobs.comment")}</div>
          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
            {String(job.comment)}
          </div>
        </div>
      )}
    </div>
  );
}
