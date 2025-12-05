import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useUserAccounting(username: string) {
  return useQuery({
    queryKey: ["user-accounting", username],
    queryFn: async () => {
      const response = await apiClient.accounting.accountingControllerGetUserInfo({
        username,
      });
      return response.data;
    },
    enabled: !!username,
    // Don't show error if accounting is not configured (returns null)
    retry: false,
  });
}

