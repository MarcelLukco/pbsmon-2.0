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
}

export function JobsTableHeader({
  sortColumn,
  sortDirection,
  onSort,
}: JobsTableHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div className="grid grid-cols-[120px_200px_150px_150px_1fr_1fr_1fr_180px] gap-4 text-sm font-medium text-gray-700">
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
          column="node"
          currentSortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        >
          {t("jobs.machine")}
        </JobsSortableHeader>

        <div className="text-center">{t("jobs.cpuReserved")}</div>

        <div className="text-center">{t("jobs.gpuReserved")}</div>

        <div>{t("jobs.ram")}</div>

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
  );
}
