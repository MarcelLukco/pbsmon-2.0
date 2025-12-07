import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { ProjectsTableHeader } from "./ProjectsTableHeader";
import { ProjectsTableRow } from "./ProjectsTableRow";
import type { SortColumn, Project } from "./types";

interface ProjectsTableProps {
  projects: Project[];
  sortColumn: SortColumn;
  sortDirection: "asc" | "desc";
  onSort: (column: SortColumn) => void;
}

export function ProjectsTable({
  projects,
  sortColumn,
  sortDirection,
  onSort,
}: ProjectsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <ProjectsTableHeader
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center">
                    <Icon
                      icon="mdi:folder-outline"
                      className="w-16 h-16 text-gray-400 mb-4"
                    />
                    <p className="text-gray-600">{t("projects.noProjects")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <ProjectsTableRow key={project.id} project={project} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
