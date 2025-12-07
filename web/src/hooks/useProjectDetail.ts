import { useQuery } from "@tanstack/react-query";
import {
  apiClient,
  type ProjectDetailDTO,
  type MetaDto,
} from "@/lib/api-client";

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
