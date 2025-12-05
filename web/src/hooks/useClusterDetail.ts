import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useClusterDetail(clusterId: string) {
  return useQuery({
    queryKey: ["cluster", clusterId],
    queryFn: async () => {
      const response =
        await apiClient.infrastructure.infrastructureControllerGetClusterDetail(
          {
            id: clusterId,
          }
        );
      return response.data;
    },
    enabled: !!clusterId,
  });
}
