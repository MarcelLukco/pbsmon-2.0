import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { QsubConfigResponseDto } from "@/lib/generated-api";

export function useQsubConfig() {
  return useQuery<QsubConfigResponseDto>({
    queryKey: ["qsub", "config"],
    queryFn: async () => {
      const response = await apiClient.qsub.qsubControllerGetConfig();
      return (response as any).data ?? response;
    },
  });
}
