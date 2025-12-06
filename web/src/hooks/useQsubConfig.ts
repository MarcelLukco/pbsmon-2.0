import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface QsubFieldConfig {
  name: string;
  type: string;
  label: { en: string; cs: string };
  description?: { en: string; cs: string };
  required?: boolean;
  default?: any;
  category: "basic" | "advanced";
  dependsOn?: string[];
  options?: any[];
}

interface QsubConfigResponse {
  fields: QsubFieldConfig[];
}

export function useQsubConfig() {
  return useQuery<QsubConfigResponse>({
    queryKey: ["qsub", "config"],
    queryFn: async () => {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.API_BASE_URL ||
        (import.meta.env.PROD ? "/api" : "http://localhost:4200");
      const normalizedBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      const url = `${normalizedBaseUrl}/qsub/config`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch QSUB config: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.data as QsubConfigResponse;
    },
  });
}

