export type SortColumn =
  | "name"
  | "status"
  | "createdAt"
  | "vmCount"
  | "vcpus"
  | "memoryGb";

export type Project = {
  id: string;
  name: string;
  status: "active" | "expired";
  reservedResources: {
    vmCount: number;
    vcpus: number;
    memoryGb: number;
  };
  createdAt?: string | null;
  isPersonal: boolean;
  isMyProject: boolean;
};
