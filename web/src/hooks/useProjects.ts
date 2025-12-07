import { useQuery } from "@tanstack/react-query";
import {
  apiClient,
  type ProjectsListDTO,
  type MetaDto,
} from "@/lib/api-client";

type ProjectsListResponse = {
  data: ProjectsListDTO;
  meta?: MetaDto;
};

interface UseProjectsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  enabled?: boolean;
}

export function useProjects(params: UseProjectsParams = {}) {
  const {
    page = 1,
    limit = 20,
    sort = "name",
    order = "asc",
    search,
    enabled = true,
  } = params;

  return useQuery<ProjectsListResponse>({
    queryKey: ["projects", page, limit, sort, order, search],
    queryFn: async () => {
      const response = await apiClient.projects.projectsControllerGetProjects({
        page,
        limit,
        sort,
        order,
        search,
      });
      return response;
    },
    enabled,
  });
}
