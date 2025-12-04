import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await apiClient.groups.groupsControllerGetGroups();
      return response;
    },
  });
}

export function useGroupDetail(groupName: string) {
  return useQuery({
    queryKey: ["groups", groupName],
    queryFn: async () => {
      const response = await apiClient.groups.groupsControllerGetGroupDetail({
        name: groupName,
      });
      return response;
    },
    enabled: !!groupName,
  });
}
