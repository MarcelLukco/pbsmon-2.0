import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUsers } from "@/hooks/useUsers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UsersSearchBar } from "@/components/users/UsersSearchBar";
import { UsersTable } from "@/components/users/UsersTable";
import { JobsPagination } from "@/components/jobs/JobsPagination";

type SortColumn =
  | "username"
  | "nickname"
  | "totalTasks"
  | "queuedTasks"
  | "runningTasks"
  | "doneTasks"
  | "cpuTasks"
  | `fairshare-${string}`;

export function UsersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sort, setSort] = useState<string>("username");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const { data, isLoading, error } = useUsers({
    page,
    limit,
    sort,
    order,
    search: search.trim() || undefined,
  });

  const handleSort = (column: SortColumn) => {
    if (sort === column) {
      // Toggle order if same column
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      // Set new column with default order
      // Default to desc for fairshare, asc for others
      const defaultOrder = column.startsWith("fairshare-") ? "desc" : "asc";
      setSort(column);
      setOrder(defaultOrder);
    }
    setPage(1); // Reset to first page on sort
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (query: string) => {
    setSearch(query);
    setPage(1); // Reset to first page on search
  };

  const handleImpersonate = (username: string) => {
    // TODO: Implement impersonate functionality
    console.log("Impersonate user:", username);
  };

  // Get fairshare servers from server response
  const fairshareServers = data?.data?.fairshareServers || [];

  const totalPages = data?.meta?.totalCount
    ? Math.ceil(data.meta.totalCount / limit)
    : 0;

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
        <UsersSearchBar
          searchQuery={search}
          onSearchChange={handleSearchChange}
          totalUsers={data?.meta?.totalCount || 0}
        />

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

        {data && data.data && (
          <>
            <UsersTable
              users={data.data.users}
              fairshareServers={fairshareServers}
              sortColumn={sort as SortColumn}
              sortDirection={order}
              onSort={handleSort}
              isAdmin={isAdmin}
              onImpersonate={handleImpersonate}
            />
            <JobsPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </>
  );
}
