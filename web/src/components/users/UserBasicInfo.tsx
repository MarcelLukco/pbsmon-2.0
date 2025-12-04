import { useTranslation } from "react-i18next";
import type { UserDetailDTO } from "@/lib/generated-api";

interface UserBasicInfoProps {
  user: UserDetailDTO;
}

export function UserBasicInfo({ user }: UserBasicInfoProps) {
  const { t } = useTranslation();

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("users.basicInfo")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">{t("users.username")}</div>
          <div className="text-lg font-medium text-gray-900">
            {user.username}
          </div>
        </div>
        {user.nickname && (
          <div>
            <div className="text-sm text-gray-500">{t("users.fullName")}</div>
            <div className="text-lg font-medium text-gray-900">
              {typeof user.nickname === "string"
                ? user.nickname
                : String(user.nickname)}
            </div>
          </div>
        )}
        {user.organization && (
          <div>
            <div className="text-sm text-gray-500">
              {t("users.organization")}
            </div>
            <div className="text-lg font-medium text-gray-900">
              {typeof user.organization === "string"
                ? user.organization
                : String(user.organization)}
            </div>
          </div>
        )}
        {user.membershipExpiration && (
          <div>
            <div className="text-sm text-gray-500">
              {t("users.membershipExpiration")}
            </div>
            <div className="text-lg font-medium text-gray-900">
              {new Date(user.membershipExpiration).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Publications */}
      {user.publications && Object.keys(user.publications).length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">
            {t("users.publications")}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(user.publications).map(([key, value]) => (
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
  );
}
