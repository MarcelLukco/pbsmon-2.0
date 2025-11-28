import { useQuery } from "@tanstack/react-query";

export function useMachineDetail(nodeName: string) {
  return useQuery({
    queryKey: ["machine", nodeName],
    queryFn: async () => {
      // Use the new endpoint: /infrastructure/machines/:nodeName
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.API_BASE_URL ||
        (import.meta.env.PROD ? "/api" : "http://localhost:4200/api");
      const normalizedBaseUrl = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      const url = `${normalizedBaseUrl}/infrastructure/machines/${encodeURIComponent(nodeName)}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch machine detail: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!nodeName,
  });
}
