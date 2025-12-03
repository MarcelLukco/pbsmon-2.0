import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface UseUsersParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  enabled?: boolean;
}

export function useUsers(params: UseUsersParams = {}) {
  const {
    page = 1,
    limit = 20,
    sort = "username",
    order = "asc",
    search,
    enabled = true,
  } = params;

  return useQuery({
    queryKey: ["users", page, limit, sort, order, search],
    queryFn: async () => {
      const response = await apiClient.users.usersControllerGetUsers({
        page,
        limit,
        sort,
        order,
        search,
      });
      return response;
    },
    enabled,
  });
}
