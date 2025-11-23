import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface UserTaskCountDTO {
  transit: number;
  queued: number;
  held: number;
  waiting: number;
  running: number;
  exiting: number;
  begun: number;
}

export interface UserFairshareDTO {
  server: string;
  ranking?: number | null;
}

export interface UserDetailDTO {
  username: string;
  nickname?: string | null;
  tasks: UserTaskCountDTO;
  cpuTasks: number;
  fairsharePerServer: UserFairshareDTO[];
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await apiClient.get<UserDetailDTO>(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}
