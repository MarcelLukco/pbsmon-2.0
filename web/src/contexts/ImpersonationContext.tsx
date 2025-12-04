import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setImpersonatedUsername as setApiImpersonation } from "@/lib/api-client";

const IMPERSONATION_STORAGE_KEY = "pbsmon_impersonated_user";

interface ImpersonationContextType {
  impersonatedUsername: string | null;
  impersonate: (username: string) => void;
  cancelImpersonation: () => void;
}

const ImpersonationContext = createContext<
  ImpersonationContextType | undefined
>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Initialize from localStorage and sync with API client immediately
  const [impersonatedUsername, setImpersonatedUsername] = useState<
    string | null
  >(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
      const username = stored || null;
      // Set API client state immediately to avoid race conditions with queries
      setApiImpersonation(username);
      return username;
    }
    return null;
  });

  // Sync with API client global state and localStorage
  useEffect(() => {
    // Set API client state immediately to avoid race conditions
    setApiImpersonation(impersonatedUsername);

    if (typeof window !== "undefined") {
      if (impersonatedUsername) {
        localStorage.setItem(IMPERSONATION_STORAGE_KEY, impersonatedUsername);
      } else {
        localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
      }
    }
  }, [impersonatedUsername]);

  const impersonate = (username: string) => {
    // Clear all query cache when starting impersonation
    queryClient.clear();
    setImpersonatedUsername(username);
  };

  const cancelImpersonation = () => {
    // Clear all query cache when stopping impersonation
    queryClient.clear();
    setImpersonatedUsername(null);
  };

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedUsername,
        impersonate,
        cancelImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error(
      "useImpersonation must be used within an ImpersonationProvider"
    );
  }
  return context;
}
