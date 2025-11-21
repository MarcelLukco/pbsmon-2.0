import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface QueueStateCountDTO {
  transit: number;
  queued: number;
  held: number;
  waiting: number;
  running: number;
  exiting: number;
  begun: number;
}

export interface QueueListDTO {
  name: string;
  server?: string | null;
  queueType: "Execution" | "Route";
  priority?: number | null;
  totalJobs?: number | null;
  stateCount?: QueueStateCountDTO | null;
  fairshare?: string | null;
  maximumForUser?: number | null;
  minWalltime?: string | null;
  maxWalltime?: string | null;
  enabled: boolean;
  started: boolean;
  hasAccess?: boolean;
  children?: QueueListDTO[];
}

export interface QueuesListDTO {
  queues: QueueListDTO[];
}

export function useQueues() {
  return useQuery({
    queryKey: ["queues"],
    queryFn: async () => {
      const response = await apiClient.get<QueuesListDTO>("/pbs/queues");
      return response.data;
    },
  });
}
