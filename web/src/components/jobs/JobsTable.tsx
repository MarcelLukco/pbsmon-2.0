import { useTranslation } from "react-i18next";
import type { JobListDTO } from "@/lib/generated-api";
import { JobsTableHeader } from "./JobsTableHeader";
import { JobsTableRow } from "./JobsTableRow";

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

interface JobsTableProps {
  jobs: JobListDTO[];
  sortColumn: SortColumn;
  sortDirection: "asc" | "desc";
  onSort: (column: SortColumn) => void;
}

export function JobsTable({
  jobs,
  sortColumn,
  sortDirection,
  onSort,
}: JobsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <JobsTableHeader
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
      />

      {/* Table Body */}
      <div>
        {jobs.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            {t("jobs.noJobsFound")}
          </div>
        ) : (
          jobs.map((job) => <JobsTableRow key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
