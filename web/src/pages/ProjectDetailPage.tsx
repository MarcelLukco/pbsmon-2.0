import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useProjectDetail } from "@/hooks/useProjectDetail";
import { ProjectBasicInfo } from "@/components/projects/ProjectBasicInfo";
import { ProjectVmsSection } from "@/components/projects/ProjectVmsSection";

export function ProjectDetailPage() {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading, error } = useProjectDetail(projectId || "");

  if (isLoading) {
    return (
      <>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-900">
              {t("pages.projectDetail")}
            </h1>
          </div>
        </header>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">{t("common.loading")}</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-900">
              {t("pages.projectDetail")}
            </h1>
          </div>
        </header>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              {t("common.errorLoading")}{" "}
              {error instanceof Error
                ? error.message
                : t("common.unknownError")}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data || !data.data) {
    return (
      <>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-900">
              {t("pages.projectDetail")}
            </h1>
          </div>
        </header>
        <div className="p-6">
          <div className="text-center text-gray-500 py-12">
            {t("projects.projectNotFound")}
          </div>
        </div>
      </>
    );
  }

  const project = data.data;

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-900">
            {t("pages.projectDetail")}
          </h1>
        </div>
      </header>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ProjectBasicInfo project={project} />
          <ProjectVmsSection vms={project.vms} />
        </div>
      </div>
    </>
  );
}
