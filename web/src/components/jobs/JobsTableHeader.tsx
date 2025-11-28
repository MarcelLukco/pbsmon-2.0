import { useTranslation } from "react-i18next";
import { JobsSortableHeader } from "./JobsSortableHeader";

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

interface JobsTableHeaderProps {
  sortColumn: SortColumn;
  sortDirection: "asc" | "desc";
  onSort: (column: SortColumn) => void;
  isAdmin?: boolean;
  hideMachineColumn?: boolean;
}

export function JobsTableHeader({
  sortColumn,
  sortDirection,
  onSort,
  hideMachineColumn = false,
}: JobsTableHeaderProps) {
  const { t } = useTranslation();

  const gridCols = hideMachineColumn
    ? "grid-cols-[80px_300px_150px_120px_1fr_1fr_1fr_180px]"
    : "grid-cols-[80px_300px_150px_120px_150px_1fr_1fr_1fr_180px]";

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div
        className={`grid ${gridCols} gap-2 text-sm font-medium text-gray-700`}
      >
        <JobsSortableHeader
          column="state"
          currentSortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        >
          {t("jobs.status")}
        </JobsSortableHeader>

        <JobsSortableHeader
          column="id"
          currentSortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        >
          {t("jobs.id")}
        </JobsSortableHeader>

        <JobsSortableHeader
          column="name"
          currentSortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        >
          {t("jobs.name")}
        </JobsSortableHeader>

        <JobsSortableHeader
          column="owner"
          currentSortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        >
          {t("jobs.username")}
        </JobsSortableHeader>

        {!hideMachineColumn && (
          <JobsSortableHeader
            column="node"
            currentSortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          >
            {t("jobs.machine")}
          </JobsSortableHeader>
        )}

        <div>{t("jobs.cpuReserved")}</div>

        <div>{t("jobs.gpuReserved")}</div>

        <div>{t("jobs.ram")}</div>

        <div className="flex justify-end">
          <JobsSortableHeader
            column="createdAt"
            currentSortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          >
            {t("jobs.created")}
          </JobsSortableHeader>
        </div>
      </div>
    </div>
  );
}
