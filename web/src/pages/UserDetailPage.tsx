import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useUserDetail } from "@/hooks/useUserDetail";

export function UserDetailPage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const { data, isLoading, error } = useUserDetail(userId || "");

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

  const totalTasks =
    data.tasks.transit +
    data.tasks.queued +
    data.tasks.held +
    data.tasks.waiting +
    data.tasks.running +
    data.tasks.exiting +
    data.tasks.begun;

  const doneTasks = data.tasks.begun + data.tasks.exiting;

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* User Info Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
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
                    {t("users.nickname")}
                  </div>
                  <div className="text-lg font-medium text-gray-900">
                    {data.nickname}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("users.tasks")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">
                  {t("queues.queued")}
                </div>
                <div className="text-xl font-medium text-gray-900">
                  {data.tasks.queued}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {t("queues.running")}
                </div>
                <div className="text-xl font-medium text-blue-600">
                  {data.tasks.running}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t("queues.done")}</div>
                <div className="text-xl font-medium text-green-600">
                  {doneTasks}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t("queues.total")}</div>
                <div className="text-xl font-medium text-gray-900">
                  {totalTasks}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">
                  {t("users.transit")}
                </div>
                <div className="text-lg font-medium text-gray-700">
                  {data.tasks.transit}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">{t("users.held")}</div>
                <div className="text-lg font-medium text-gray-700">
                  {data.tasks.held}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {t("users.waiting")}
                </div>
                <div className="text-lg font-medium text-gray-700">
                  {data.tasks.waiting}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {t("users.exiting")}
                </div>
                <div className="text-lg font-medium text-gray-700">
                  {data.tasks.exiting}
                </div>
              </div>
            </div>
          </div>

          {/* CPU Tasks Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("users.cpuTasks")}
            </h2>
            <div className="text-2xl font-medium text-blue-600">
              {data.cpuTasks}
            </div>
          </div>

          {/* Fairshare Per Server Section */}
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
                    {data.fairsharePerServer.map((item) => {
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
                            {item.ranking !== null &&
                            item.ranking !== undefined ? (
                              <div className="flex items-center gap-2">
                                {getRankingIcon(item.ranking)}
                                <span className="font-medium">
                                  {item.ranking}
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
      </div>
    </>
  );
}
