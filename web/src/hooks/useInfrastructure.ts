import { useQuery } from "@tanstack/react-query";

export type NodeState = "free" | "partially_used" | "used" | "unknown";

export interface InfrastructureNodeListDTO {
  name: string;
  cpu: number;
  actualState?: NodeState | null;
  cpuUsagePercent?: number | null;
  gpuUsagePercent?: number | null;
}

export interface InfrastructureClusterListDTO {
  id: string;
  name: string;
  cluster: string;
  totalCpu: number;
  nodeCount: number;
  nodes: InfrastructureNodeListDTO[];
}

export interface InfrastructureOrganizationListDTO {
  id: string;
  name: {
    cs: string;
    en: string;
  };
  clusterCount: number;
  clusters: InfrastructureClusterListDTO[];
}

export interface InfrastructureListMetaDto {
  totalOrganizations: number;
  totalClusters: number;
  totalNodes: number;
  totalCpu: number;
  totalGpu?: number | null;
  totalMemory?: number | null;
  freeNodes: number;
  partiallyUsedNodes: number;
  usedNodes: number;
  unknownNodes: number;
}

export interface InfrastructureListResponse {
  data: InfrastructureOrganizationListDTO[];
  meta: InfrastructureListMetaDto;
}

export function useInfrastructure() {
  return useQuery<InfrastructureListResponse>({
    queryKey: ["infrastructure"],
    queryFn: async () => {
      // Fetch the raw response - the backend returns { data: [...], meta: {...} }
      const url = `${
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.API_BASE_URL ||
        (import.meta.env.PROD ? "/api" : "http://localhost:4200/api")
      }/infrastructure`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      // The backend returns { data: InfrastructureOrganizationListDTO[], meta: InfrastructureListMetaDto }
      return result as InfrastructureListResponse;
    },
  });
}
