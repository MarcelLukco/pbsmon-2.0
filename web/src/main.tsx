import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ApiError } from "./lib/generated-api/core/ApiError";
import "react-tooltip/dist/react-tooltip.css";
import App from "./App.tsx";

const handle401Error = (error: unknown) => {
  if (error instanceof ApiError && error.status === 401) {
    window.location.href = "/api/auth/login";
  }
};

const queryCache = new QueryCache({
  onError: handle401Error,
});

const mutationCache = new MutationCache({
  onError: handle401Error,
});

const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 401 Unauthorized
        if (error instanceof ApiError && error.status === 401) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
