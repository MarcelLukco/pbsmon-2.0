import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const USER_ROLE = {
  ADMIN: "admin",
  USER: "user",
} as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await apiClient.auth.authControllerGetCurrentUser();
      return response.data;
    },
  });
}
