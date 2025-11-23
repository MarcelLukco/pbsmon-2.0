import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface UserListDTO {
  username: string;
  nickname?: string | null;
  totalTasks: number;
  queuedTasks: number;
  runningTasks: number;
  doneTasks: number;
  cpuTasks: number;
  fairshareRankings?: Record<string, number> | null;
}

export interface UsersListDTO {
  users: UserListDTO[];
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await apiClient.get<UsersListDTO>("/users");
      return response.data;
    },
  });
}
