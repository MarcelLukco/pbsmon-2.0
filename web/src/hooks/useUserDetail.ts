import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await apiClient.users.usersControllerGetUserDetail({
        id: userId,
      });
      return response.data;
    },
    enabled: !!userId,
  });
}
