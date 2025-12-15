import { useMutation } from "@tanstack/react-query";

interface QsubPreviewRequest {
  walltime?: string;
  queue?: string;
  ncpu: number;
  ngpu?: number;
  scratch_type?: string;
  scratch_memory?: number;
  cluster?: string;
  vnode?: string;
  place?: string;
  arch?: string;
  cgroups?: string[];
  cpu_flag?: string[];
  cpu_vendor?: string;
  gpu_cap?: string[];
  host_licenses?: string[];
  luna?: string;
  pbs_server?: string;
  singularity?: boolean;
  spec?: number;
  osfamily?: string;
  os?: string;
  umg?: boolean;
}

import type { InfrastructureNodeListDTO } from "@/lib/generated-api";

export interface QualifiedNode extends InfrastructureNodeListDTO {
  canRunImmediately: boolean;
}

interface QsubPreviewResponse {
  qsubCommand: string;
  qsubScript: string;
  qualifiedNodes: QualifiedNode[];
  totalCount: number;
  immediatelyAvailableCount: number;
}

export function useQsubPreview() {
  return useMutation<QsubPreviewResponse, Error, QsubPreviewRequest>({
    mutationFn: async (request) => {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.API_BASE_URL ||
        (import.meta.env.PROD ? "/api" : "http://localhost:4000");
      const normalizedBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      const url = `${normalizedBaseUrl}/qsub/preview`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to get QSUB preview: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data as QsubPreviewResponse;
    },
  });
}
