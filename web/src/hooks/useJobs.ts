import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { JobsListDTO, MetaDto } from "@/lib/generated-api";

type JobsListResponse = {
  data: JobsListDTO;
  meta?: MetaDto;
};

interface UseJobsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  state?: string;
  node?: string;
  enabled?: boolean;
}

export function useJobs(params: UseJobsParams = {}) {
  const {
    page = 1,
    limit = 20,
    sort = "createdAt",
    order = "desc",
    search,
    state,
    node,
    enabled = true,
  } = params;

  return useQuery<JobsListResponse>({
    queryKey: ["jobs", page, limit, sort, order, search, state, node],
    queryFn: async () => {
      const response = await apiClient.jobs.jobsControllerGetJobs({
        page,
        limit,
        sort,
        order,
        search,
        state,
        node,
      });
      return response;
    },
    enabled,
  });
}
