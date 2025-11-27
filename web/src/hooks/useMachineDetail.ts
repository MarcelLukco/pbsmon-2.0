import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useMachineDetail(machineId: string) {
  return useQuery({
    queryKey: ["machine", machineId],
    queryFn: async () => {
      const response =
        await apiClient.infrastructure.infrastructureControllerGetInfrastructureDetail(
          {
            id: machineId,
          }
        );
      return response.data;
    },
    enabled: !!machineId,
  });
}
