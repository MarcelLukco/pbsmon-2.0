import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { Tooltip } from "react-tooltip";

type ProjectUser = {
  logname: string;
  name: string;
  org?: string | null;
  id?: string | null;
  foundInPerun?: boolean;
};

interface ProjectUsersSectionProps {
  users: ProjectUser[];
}

export function ProjectUsersSection({ users }: ProjectUsersSectionProps) {
  const { t } = useTranslation();

  if (users.length === 0) {
    return (
      <div className="px-6 py-4 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("projects.users")}
        </h2>
        <div className="text-center text-gray-500 py-8">
          <Icon
            icon="mdi:account-off"
            className="w-12 h-12 mx-auto mb-2 text-gray-400"
          />
          <p>{t("projects.noUsers")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("projects.users")} ({users.length})
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("projects.userName")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("projects.userLogname")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("projects.userOrg")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => {
              const isFoundInPerun = user.foundInPerun !== false;
              const tooltipId = `user-not-found-${index}`;

              return (
                <tr
                  key={user.logname || user.id || index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isFoundInPerun ? (
                      <Link
                        to={`/users/${encodeURIComponent(user.logname)}`}
                        className="flex items-center text-sm font-medium text-primary-700 hover:text-primary-900"
                      >
                        <Icon
                          icon="mdi:account"
                          className="w-5 h-5 text-gray-400 mr-2"
                        />
                        <span>{user.name}</span>
                      </Link>
                    ) : (
                      <>
                        <div
                          className="flex items-center text-sm font-medium text-gray-600"
                          data-tooltip-id={tooltipId}
                          data-tooltip-content={t(
                            "projects.userNotFoundInPerun"
                          )}
                        >
                          <Icon
                            icon="mdi:account-alert"
                            className="w-5 h-5 text-gray-400 mr-2"
                          />
                          <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {user.id || user.name}
                          </code>
                        </div>
                        <Tooltip
                          id={tooltipId}
                          style={{ maxWidth: "300px", whiteSpace: "normal" }}
                        />
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {user.logname || "-"}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {user.org || "-"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
