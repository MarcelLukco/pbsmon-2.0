import { useQuery } from "@tanstack/react-query";
import { apiClient, type QsubConfigResponseDto } from "@/lib/api-client";

export function useQsubConfig() {
  return useQuery<QsubConfigResponseDto>({
    queryKey: ["qsub", "config"],
    queryFn: async () => {
      const response = await apiClient.qsub.qsubControllerGetConfig();
      return (response as any).data ?? response;
    },
  });
}
