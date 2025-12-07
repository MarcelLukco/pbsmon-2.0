import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ProjectDetailDTO, MetaDto } from "@/lib/generated-api";

type ProjectDetailResponse = {
  data: ProjectDetailDTO;
  meta?: MetaDto;
};

export function useProjectDetail(projectId: string) {
  return useQuery<ProjectDetailResponse>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response =
        await apiClient.projects.projectsControllerGetProjectDetail({
          id: projectId,
        });
      return response;
    },
    enabled: !!projectId,
  });
}
