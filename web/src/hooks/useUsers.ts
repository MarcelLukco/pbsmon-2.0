import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await apiClient.users.usersControllerGetUsers();
      return response.data;
    },
  });
}
