import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useStorageSpaces() {
  return useQuery({
    queryKey: ["storage-spaces"],
    queryFn: async () => {
      const response =
        await apiClient.storageSpaces.storageSpacesControllerGetStorageSpaces();
      return response.data;
    },
  });
}
