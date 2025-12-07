import { ProjectsSortIcon } from "./ProjectsSortIcon";
import type { SortColumn } from "./types";

interface ProjectsSortableHeaderProps {
  column: SortColumn;
  currentSortColumn: SortColumn;
  sortDirection: "asc" | "desc";
  onSort: (column: SortColumn) => void;
  children: React.ReactNode;
}

export function ProjectsSortableHeader({
  column,
  currentSortColumn,
  sortDirection,
  onSort,
  children,
}: ProjectsSortableHeaderProps) {
  return (
    <div
      className="flex items-center cursor-pointer hover:text-primary-600 select-none"
      onClick={() => onSort(column)}
    >
      {children}
      <ProjectsSortIcon
        column={column}
        currentSortColumn={currentSortColumn}
        sortDirection={sortDirection}
      />
    </div>
  );
}
