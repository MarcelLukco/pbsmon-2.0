import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface UseQueuesParams {
  user?: string;
  server?: string;
  enabled?: boolean;
}

export function useQueues(params: UseQueuesParams = {}) {
  const { user, server, enabled = true } = params;
  return useQuery({
    queryKey: ["queues", user, server],
    queryFn: async () => {
      const response = await apiClient.queues.queuesControllerGetQueues({
        user,
        server,
      });
      return response.data;
    },
    enabled,
  });
}
