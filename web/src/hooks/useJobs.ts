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
}

export function useJobs(params: UseJobsParams = {}) {
  const {
    page = 1,
    limit = 20,
    sort = "createdAt",
    order = "desc",
    search,
    state,
  } = params;

  return useQuery<JobsListResponse>({
    queryKey: ["jobs", page, limit, sort, order, search, state],
    queryFn: async () => {
      const response = await apiClient.jobs.jobsControllerGetJobs({
        page,
        limit,
        sort,
        order,
        search,
        state,
      });
      return response;
    },
  });
}
