import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { QueueDetailDTO } from "@/lib/generated-api";

type QueueDetailResponse = {
  data: QueueDetailDTO;
};

export function useQueueDetail(queueId: string) {
  // Parse queueId - format: "queueName@server.metacentrum.cz" or just "queueName"
  const [queueName, serverWithDomain] = queueId.includes("@")
    ? queueId.split("@")
    : [queueId, undefined];

  // Extract server name from "server.metacentrum.cz" format
  const server = serverWithDomain ? serverWithDomain.split(".")[0] : undefined;

  return useQuery<QueueDetailResponse>({
    queryKey: ["queue", queueName, server],
    queryFn: async () => {
      const response = await apiClient.queues.queuesControllerGetQueueDetail({
        id: queueName,
        server: server,
      });
      return response;
    },
    enabled: !!queueName,
  });
}
