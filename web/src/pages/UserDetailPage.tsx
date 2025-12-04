import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useUserDetail } from "@/hooks/useUserDetail";
import { useJobs } from "@/hooks/useJobs";
import { useQueues } from "@/hooks/useQueues";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Tabs } from "@/components/common/Tabs";
import { JobsTable } from "@/components/jobs/JobsTable";
import { JobsPagination } from "@/components/jobs/JobsPagination";
import { JobsSearchBar } from "@/components/jobs/JobsSearchBar";
import { QueueTreeNode } from "@/components/common/QueueTreeNode";
import type { UserFairshareDTO } from "@/lib/generated-api";

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

export function UserDetailPage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const { data, isLoading, error } = useUserDetail(userId || "");
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  // Tab state
  const [activeTab, setActiveTab] = useState("jobs");

  // Jobs tab state
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLimit] = useState(20);
  const [jobsSort, setJobsSort] = useState<SortColumn>("createdAt");
  const [jobsOrder, setJobsOrder] = useState<"asc" | "desc">("desc");
  const [jobsSearch, setJobsSearch] = useState("");

  // Fetch jobs filtered by user
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
  } = useJobs({
    page: jobsPage,
    limit: jobsLimit,
    sort: jobsSort,
    order: jobsOrder,
    search: userId || undefined, // Filter by username
    enabled: activeTab === "jobs" && !!userId,
  });

  // Fetch queues filtered by the viewed user (backend returns only queues the user has access to)
  const {
    data: queuesData,
    isLoading: queuesLoading,
    error: queuesError,
  } = useQueues({
    user: userId || undefined,
    enabled: activeTab === "queues" && !!userId,
  });

  // Backend already filters queues, so use them directly
  const filteredQueues = queuesData?.queues || [];

  const handleJobsSort = (column: SortColumn) => {
    if (jobsSort === column) {
      setJobsOrder(jobsOrder === "asc" ? "desc" : "asc");
    } else {
      setJobsSort(column);
      setJobsOrder("desc");
    }
    setJobsPage(1);
  };

  const handleJobsPageChange = (newPage: number) => {
    setJobsPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJobsSearchChange = (query: string) => {
    setJobsSearch(query);
    setJobsPage(1);
  };

  if (isLoading) {
    return (
      <>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-900">
              {t("pages.userDetail")}
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
              {t("pages.userDetail")}
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

  if (!data) {
    return (
      <>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary-900">
              {t("pages.userDetail")}
            </h1>
          </div>
        </header>
        <div className="p-6">
          <div className="text-center text-gray-500 py-12">
            {t("users.userNotFound")}
          </div>
        </div>
      </>
    );
  }

  const jobsTotalPages = jobsData?.meta?.totalCount
    ? Math.ceil(jobsData.meta.totalCount / jobsLimit)
    : 0;

  const tabs = [
    {
      id: "jobs",
      label: t("users.tabs.jobs"),
      content: (
        <div>
          <JobsSearchBar
            searchQuery={jobsSearch}
            onSearchChange={handleJobsSearchChange}
            totalJobs={jobsData?.meta?.totalCount || 0}
          />

          {jobsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">{t("common.loading")}</div>
            </div>
          )}

          {jobsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-800">
                {t("common.errorLoading")}{" "}
                {jobsError instanceof Error
                  ? jobsError.message
                  : t("common.unknownError")}
              </div>
            </div>
          )}

          {jobsData && jobsData.data && (
            <>
              <JobsTable
                jobs={jobsData.data.jobs}
                sortColumn={jobsSort}
                sortDirection={jobsOrder}
                onSort={handleJobsSort}
                isAdmin={isAdmin}
              />
              <JobsPagination
                currentPage={jobsPage}
                totalPages={jobsTotalPages}
                onPageChange={handleJobsPageChange}
              />
            </>
          )}

          {!jobsLoading &&
            !jobsError &&
            jobsData?.data &&
            jobsData.data.jobs.length === 0 && (
              <div className="text-gray-500 py-8 text-center">
                {t("jobs.noJobsFound")}
              </div>
            )}
        </div>
      ),
    },
    {
      id: "queues",
      label: t("users.tabs.queues"),
      content: (
        <div>
          {queuesLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">{t("common.loading")}</div>
            </div>
          )}

          {queuesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-800">
                {t("common.errorLoading")}{" "}
                {queuesError instanceof Error
                  ? queuesError.message
                  : t("common.unknownError")}
              </div>
            </div>
          )}

          {filteredQueues.length === 0 && !queuesLoading && !queuesError && (
            <div className="text-gray-500 py-8 text-center">
              {t("queues.noQueuesFound")}
            </div>
          )}

          {filteredQueues.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
              <div className="min-w-max">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
                    <div className="col-span-3">{t("queues.queueName")}</div>
                    <div className="col-span-1">{t("queues.priority")}</div>
                    <div className="col-span-2">{t("queues.timeLimits")}</div>
                    <div className="col-span-5">{t("queues.jobs")}</div>
                    <div className="col-span-1">{t("queues.fairshare")}</div>
                  </div>
                </div>

                <div>
                  {filteredQueues.map((queue, index) => (
                    <QueueTreeNode
                      key={queue.name}
                      queue={queue}
                      level={0}
                      isLast={index === filteredQueues.length - 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-900">
            {t("pages.userDetail")}
          </h1>
        </div>
      </header>
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Basic Info Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("users.basicInfo")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">
                  {t("users.username")}
                </div>
                <div className="text-lg font-medium text-gray-900">
                  {data.username}
                </div>
              </div>
              {data.nickname && (
                <div>
                  <div className="text-sm text-gray-500">
                    {t("users.fullName")}
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {typeof data.nickname === "string"
                      ? data.nickname
                      : String(data.nickname)}
                  </div>
                </div>
              )}
              {data.organization && (
                <div>
                  <div className="text-sm text-gray-500">
                    {t("users.organization")}
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {typeof data.organization === "string"
                      ? data.organization
                      : String(data.organization)}
                  </div>
                </div>
              )}
            </div>

            {/* Publications */}
            {data.publications && Object.keys(data.publications).length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">
                  {t("users.publications")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.publications).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fairshare Section */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("users.fairsharePerServer")}
              </h2>
              <div className="relative group">
                <svg
                  className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-normal w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {t("fairshare.infoTooltip")}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            {data.fairsharePerServer.length === 0 ? (
              <div className="text-gray-500">{t("users.noFairshareData")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("users.server")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("fairshare.ranking")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.fairsharePerServer.map((item: UserFairshareDTO) => {
                      // Handle ranking - it might be number or Record<string, any> from generated types
                      const rankingValue =
                        typeof item.ranking === "number"
                          ? item.ranking
                          : item.ranking !== null
                            ? Number(item.ranking)
                            : null;
                      const getRankingIcon = (
                        ranking: number | null | undefined
                      ) => {
                        if (ranking === null || ranking === undefined)
                          return null;
                        if (ranking <= 10) {
                          return (
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          );
                        } else if (ranking <= 50) {
                          return (
                            <svg
                              className="w-4 h-4 text-yellow-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          );
                        } else {
                          return (
                            <svg
                              className="w-4 h-4 text-red-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          );
                        }
                      };

                      return (
                        <tr key={item.server} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.server}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {rankingValue !== null &&
                            rankingValue !== undefined &&
                            !isNaN(rankingValue) ? (
                              <div className="flex items-center gap-2">
                                {getRankingIcon(rankingValue)}
                                <span className="font-medium">
                                  {rankingValue}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </>
  );
}
