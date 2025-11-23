import { useTranslation } from "react-i18next";
import { useUsers } from "@/hooks/useUsers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUsersSorting } from "@/hooks/useUsersSorting";
import { UsersSearchBar } from "@/components/users/UsersSearchBar";
import { UsersTable } from "@/components/users/UsersTable";

export function UsersPage() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useUsers();
  const { data: currentUser } = useCurrentUser();

  const isAdmin = currentUser?.role === "admin";

  const {
    sortColumn,
    sortDirection,
    searchQuery,
    setSearchQuery,
    handleSort,
    fairshareServers,
    sortedUsers,
  } = useUsersSorting(data?.users);

  const handleImpersonate = (username: string) => {
    // TODO: Implement impersonate functionality
    console.log("Impersonate user:", username);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-900">
            {t("pages.users")}
          </h1>
        </div>
      </header>
      <div className="p-6">
        {data && (
          <UsersSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalUsers={data.users.length}
            filteredCount={searchQuery ? sortedUsers.length : undefined}
          />
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">{t("common.loading")}</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              {t("common.errorLoading")}{" "}
              {error instanceof Error
                ? error.message
                : t("common.unknownError")}
            </div>
          </div>
        )}

        {data && (
          <UsersTable
            users={sortedUsers}
            totalUsers={data.users.length}
            fairshareServers={fairshareServers}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            isAdmin={isAdmin}
            onImpersonate={handleImpersonate}
          />
        )}
      </div>
    </>
  );
}
