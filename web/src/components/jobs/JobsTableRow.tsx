import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import type { JobListDTO } from "@/lib/generated-api";
import { ProgressBar } from "@/components/common/ProgressBar";

interface JobsTableRowProps {
  job: JobListDTO;
  hideMachineColumn?: boolean;
  hideUserColumn?: boolean;
}

export function JobsTableRow({
  job,
  hideMachineColumn = false,
  hideUserColumn = false,
}: JobsTableRowProps) {
  const { t } = useTranslation();

  const username = job.username || job.owner?.split("@")[0];

  // Get state label and color from backend
  const stateName = String((job as any).stateName || job.state || "");
  const stateColor = String(
    (job as any).stateColor || "bg-gray-100 text-gray-800"
  );
  const stateLabel = String(
    t(`jobs.state.${stateName}`, { default: stateName })
  );

  const stateInfo = {
    label: stateLabel,
    color: stateColor,
  };
  const jobState = String(job.state || "");

  // Check if this is a parent job (array job controller)
  // Parent jobs have IDs like "14699148[].pbs-m1.metacentrum.cz"
  const isParentJob = /\[\]/.test(job.id);
  const parentJobTooltipId = `parent-job-${job.id}`;

  // Format date (DD.MM.YYYY)
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format time (HH:MM)
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format time string (HH:MM:SS)
  const formatTimeString = (timeStr: string | null | undefined) => {
    if (!timeStr) return null;
    return timeStr;
  };

  // Calculate grid columns based on which columns are hidden
  let gridCols: string;
  if (hideMachineColumn && hideUserColumn) {
    gridCols = "grid-cols-[80px_300px_150px_1fr_1fr_1fr_180px]";
  } else if (hideMachineColumn) {
    gridCols = "grid-cols-[80px_300px_150px_120px_1fr_1fr_1fr_180px]";
  } else if (hideUserColumn) {
    gridCols = "grid-cols-[80px_300px_150px_150px_1fr_1fr_1fr_180px]";
  } else {
    gridCols = "grid-cols-[80px_300px_150px_120px_150px_1fr_1fr_1fr_180px]";
  }

  return (
    <div
      className={`grid ${gridCols} gap-2 items-center py-3 px-4 border-b border-gray-100 bg-white hover:bg-gray-50`}
    >
      {/* Status Column */}
      <div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stateInfo.color}`}
        >
          {stateInfo.label}
        </span>
        {typeof job.exitCode === "number" && (
          <div className="text-xs text-gray-500 mt-1">
            {t("jobs.exit")}: {String(job.exitCode)}
          </div>
        )}
      </div>

      {/* ID Column */}
      <div className="text-left">
        <div className="flex items-center gap-2">
          <Link
            to={`/jobs/${encodeURIComponent(job.id)}`}
            className="text-sm text-gray-900 font-mono hover:text-primary-600 underline cursor-pointer"
          >
            <span>{job.id}</span>
          </Link>
          {isParentJob && (
            <>
              <Icon
                icon="ph:tree-view-fill"
                className="w-4 h-4 text-primary-600"
                data-tooltip-id={parentJobTooltipId}
                data-tooltip-content={t("jobs.parentJobTooltip")}
              />
              <Tooltip id={parentJobTooltipId} />
            </>
          )}
        </div>
        {(jobState === "R" ||
          jobState === "C" ||
          jobState === "F" ||
          jobState === "X") &&
          job.runtime && (
            <div className="text-xs text-gray-600 mt-1">
              {t("jobs.runtime")}: {formatTimeString(String(job.runtime))}
            </div>
          )}
      </div>

      {/* Name Column */}
      <div
        className="text-sm text-gray-900 truncate"
        title={String(job.name || "")}
      >
        {String(job.name || "")}
      </div>

      {/* Username Column - Show username if canSeeOwner, anonymized otherwise */}
      {!hideUserColumn && (
        <div className="text-sm">
          {job.canSeeOwner && username ? (
            <Link
              to={`/users/${encodeURIComponent(username)}`}
              className="text-gray-900 hover:text-primary-600 underline cursor-pointer"
            >
              {String(username)}
            </Link>
          ) : (
            <span className="text-gray-900">{t("jobs.anonym")}</span>
          )}
        </div>
      )}

      {/* Machine Column */}
      {!hideMachineColumn && (
        <div className="text-sm">
          {job.node ? (
            <span>{String(job.node)}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )}

      {/* CPU Column */}
      <div className="text-sm">
        {(jobState === "R" ||
          jobState === "C" ||
          jobState === "F" ||
          jobState === "X") &&
        typeof job.cpuUsagePercent === "number" &&
        job.cpuUsagePercent !== null &&
        job.cpuUsagePercent !== undefined ? (
          <div className="mb-1">
            <ProgressBar
              label={`CPU:`}
              value={
                typeof job.cpuReserved === "number"
                  ? job.cpuReserved
                  : Number(job.cpuReserved) || 0
              }
              percent={job.cpuUsagePercent}
              color={(percent) => (percent < 50 ? "#ef4444" : "#4b5563")}
              icon={
                <Icon icon="solar:cpu-bold" className="w-[14px] h-[14px]" />
              }
            />
            {job.cpuTimeUsed && (
              <div className="text-gray-600 flex justify-between">
                <span>{t("jobs.cpuTime")}:</span>
                <span>{formatTimeString(String(job.cpuTimeUsed))}</span>
              </div>
            )}
          </div>
        ) : job.cpuTimeUsed ? (
          // Show CPU time even if CPU percent is not available (for completed jobs)
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-gray-900">
                {typeof job.cpuReserved === "number"
                  ? job.cpuReserved
                  : Number(job.cpuReserved) || 0}
              </span>
              <Icon icon="solar:cpu-bold" className="w-[14px] h-[14px]" />
            </div>
            <div className="text-gray-600 flex justify-between">
              <span>{t("jobs.cpuTime")}:</span>
              <span>{formatTimeString(String(job.cpuTimeUsed))}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-gray-900">
              {typeof job.cpuReserved === "number"
                ? job.cpuReserved
                : Number(job.cpuReserved) || 0}
            </span>
            <Icon icon="solar:cpu-bold" className="w-[14px] h-[14px]" />
          </div>
        )}
      </div>

      {/* GPU Column */}
      <div className="text-sm">
        {jobState === "R" && job.gpuTimeUsed && (
          <div className="mb-1">
            <span className="text-gray-600">{t("jobs.gpuTime")}: </span>
            <span className="font-medium">
              {formatTimeString(String(job.gpuTimeUsed))}
            </span>
          </div>
        )}
        {jobState === "R" &&
        typeof job.gpuUsagePercent === "number" &&
        job.gpuUsagePercent !== null &&
        job.gpuUsagePercent !== undefined ? (
          <div className="mb-1">
            <ProgressBar
              label=""
              value={
                typeof job.gpuReserved === "number"
                  ? job.gpuReserved
                  : Number(job.gpuReserved) || 0
              }
              percent={job.gpuUsagePercent}
              color="#4b5563"
              icon={<Icon icon="bi:gpu-card" className="w-[14px] h-[14px]" />}
            />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-gray-900">
              {typeof job.gpuReserved === "number"
                ? job.gpuReserved
                : Number(job.gpuReserved) || 0}
            </span>
            <Icon icon="bi:gpu-card" className="w-[14px] h-[14px]" />
          </div>
        )}
      </div>

      {/* RAM Column */}
      <div className="text-sm">
        {jobState === "R" &&
        typeof job.memoryUsagePercent === "number" &&
        job.memoryUsagePercent !== null &&
        job.memoryUsagePercent !== undefined ? (
          <div className="mb-1">
            <ProgressBar
              label="RAM"
              value={`${
                typeof job.memoryReserved === "number"
                  ? job.memoryReserved
                  : Number(job.memoryReserved) || 0
              } ${t("jobs.gb")}`}
              percent={job.memoryUsagePercent}
              color="#4b5563"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-gray-900">
              {typeof job.memoryReserved === "number"
                ? job.memoryReserved
                : Number(job.memoryReserved) || 0}{" "}
              {t("jobs.gb")}
            </span>

            <Icon icon="ph:memory" className="w-[14px] h-[14px]" />
          </div>
        )}
      </div>

      {/* Created Column */}
      <div className="text-sm text-gray-600 text-right">
        {formatDate(
          typeof job.createdAt === "number"
            ? job.createdAt
            : Number(job.createdAt) || 0
        )}
        <br />
        {formatTime(
          typeof job.createdAt === "number"
            ? job.createdAt
            : Number(job.createdAt) || 0
        )}
      </div>
    </div>
  );
}
