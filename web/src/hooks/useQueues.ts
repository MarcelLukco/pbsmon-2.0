import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useQueues() {
  return useQuery({
    queryKey: ["queues"],
    queryFn: async () => {
      const response = await apiClient.queues.queuesControllerGetQueues({});
      return response.data;
    },
  });
}
