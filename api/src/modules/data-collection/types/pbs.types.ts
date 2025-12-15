/**
 * Base structure for all PBS entity collections
 */
export interface PbsCollection<T extends PbsEntity> {
  type: string;
  count: number;
  items: T[];
}

export interface PbsEntity {
  name: string;
  attributes: Record<string, string>;
}

export interface PbsJob extends PbsEntity {
  name: string; // Job ID (e.g., "11118906.pbs-m1.metacentrum.cz")
}

export interface PbsQueue extends PbsEntity {
  name: string;
}

export interface PbsNode extends PbsEntity {
  name: string; // Node name (e.g., "zenon1")
}

export interface PbsServer extends PbsEntity {
  name: string; // Server name (e.g., "pbs-m1.metacentrum.cz")
}

export interface PbsResource extends PbsEntity {
  name: string; // Resource name (e.g., "mem", "ncpus")
}

export interface PbsReservation extends PbsEntity {
  name: string; // Reservation ID
}

export interface PbsScheduler extends PbsEntity {
  name: string; // Scheduler name (e.g., "default", "elixir")
}

export interface PbsHook extends PbsEntity {
  name: string;
}

export interface PbsFairshareEntry {
  username: string;
  value1: number;
  value2: number; // The "crazy number" - fairshare value
}

export interface PbsFairshare {
  entries: PbsFairshareEntry[];
}

export interface PbsServerData {
  timestamp: string;
  serverName: string;
  jobs: PbsCollection<PbsJob> | null;
  queues: PbsCollection<PbsQueue> | null;
  nodes: PbsCollection<PbsNode> | null;
  servers: PbsCollection<PbsServer> | null;
  resources: PbsCollection<PbsResource> | null;
  reservations: PbsCollection<PbsReservation> | null;
  schedulers: PbsCollection<PbsScheduler> | null;
  hooks: PbsCollection<PbsHook> | null;
  fairshare: PbsFairshare | null;
}

export interface PbsData {
  timestamp: string;
  servers: Record<string, PbsServerData>;
}
