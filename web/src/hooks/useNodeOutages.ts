import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { OutageRecordDTO } from "@/lib/generated-api";

export function useNodeOutages(nodeName: string | null) {
  return useQuery<OutageRecordDTO[]>({
    queryKey: ["node-outages", nodeName],
    queryFn: async () => {
      if (!nodeName) {
        return [];
      }
      const response =
        await apiClient.accounting.accountingControllerGetOutagesForNode({
          nodeName,
        });
      return response.data || [];
    },
    enabled: !!nodeName,
    // Don't show error if accounting is not configured (returns empty array)
    retry: false,
  });
}
