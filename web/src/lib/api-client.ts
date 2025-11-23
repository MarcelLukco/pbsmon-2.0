// This file provides API client functionality using the generated OpenAPI client

import { ApiClient } from "./generated-api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.API_BASE_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:4200/api");

// Ensure BASE URL doesn't have trailing slash (generated client will add paths with leading slash)
const normalizedBaseUrl = API_BASE_URL.endsWith("/")
  ? API_BASE_URL.slice(0, -1)
  : API_BASE_URL;

// Create and export a configured API client instance
export const apiClient = new ApiClient({
  BASE: normalizedBaseUrl,
  WITH_CREDENTIALS: true,
  CREDENTIALS: "include",
});

// Re-export generated types and services for convenience
export * from "./generated-api";
