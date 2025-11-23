import { SortIcon } from "./SortIcon";

type SortColumn =
  | "username"
  | "nickname"
  | "totalTasks"
  | "queuedTasks"
  | "runningTasks"
  | "doneTasks"
  | "cpuTasks"
  | `fairshare-${string}`;

interface SortableHeaderProps {
  column: SortColumn;
  currentSortColumn: SortColumn;
  sortDirection: "asc" | "desc";
  onSort: (column: SortColumn) => void;
  children: React.ReactNode;
}

export function SortableHeader({
  column,
  currentSortColumn,
  sortDirection,
  onSort,
  children,
}: SortableHeaderProps) {
  return (
    <div
      className="flex items-center cursor-pointer hover:text-primary-600 select-none"
      onClick={() => onSort(column)}
    >
      {children}
      <SortIcon
        column={column}
        currentSortColumn={currentSortColumn}
        sortDirection={sortDirection}
      />
    </div>
  );
}
