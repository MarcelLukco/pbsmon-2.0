import { ApiClient } from "./generated-api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.API_BASE_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:4200");

const normalizedBaseUrl = API_BASE_URL.endsWith("/")
  ? API_BASE_URL.slice(0, -1)
  : API_BASE_URL;

export const apiClient = new ApiClient({
  BASE: normalizedBaseUrl,
  WITH_CREDENTIALS: true,
  CREDENTIALS: "include",
});

export * from "./generated-api";
