import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useJobDetail(jobId: string) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const response = await apiClient.jobs.jobsControllerGetJobDetail({
        jobId: jobId,
      });
      return response.data;
    },
    enabled: !!jobId,
  });
}

