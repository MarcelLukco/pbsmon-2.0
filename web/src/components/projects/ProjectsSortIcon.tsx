import { Icon } from "@iconify/react";
import type { SortColumn } from "./types";

interface ProjectsSortIconProps {
  column: SortColumn;
  currentSortColumn: SortColumn;
  sortDirection: "asc" | "desc";
}

export function ProjectsSortIcon({
  column,
  currentSortColumn,
  sortDirection,
}: ProjectsSortIconProps) {
  if (currentSortColumn !== column) {
    return (
      <Icon
        icon="icon-park-outline:sort"
        className="w-4 h-4 ml-1 text-gray-400"
      />
    );
  }

  return sortDirection === "asc" ? (
    <Icon icon="prime:sort-up-fill" className="w-4 h-4 ml-1 text-primary-600" />
  ) : (
    <Icon
      icon="prime:sort-down-fill"
      className="w-4 h-4 ml-1 text-primary-600"
    />
  );
}
