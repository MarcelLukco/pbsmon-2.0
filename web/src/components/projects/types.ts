export type SortColumn =
  | "name"
  | "status"
  | "vmCount"
  | "vcpus"
  | "memoryGb";

// Re-export ProjectDTO as Project for convenience
export type { ProjectDTO as Project } from "@/lib/generated-api";
