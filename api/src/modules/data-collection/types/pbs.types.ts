/**
 * Base structure for all PBS entity collections
 */
export interface PbsCollection<T extends PbsEntity> {
  type: string;
  count: number;
  items: T[];
}

/**
 * Base structure for PBS entities (jobs, queues, nodes, etc.)
 * All attributes are string key-value pairs
 */
export interface PbsEntity {
  name: string;
  attributes: Record<string, string>;
}

/**
 * PBS Job entity
 * Common attributes: Job_Name, Job_Owner, job_state, queue, server, Priority,
 * Resource_List.mem, Resource_List.ncpus, Resource_List.ngpus, Resource_List.walltime, etc.
 */
export interface PbsJob extends PbsEntity {
  name: string; // Job ID (e.g., "11118906.pbs-m1.metacentrum.cz")
}

/**
 * PBS Queue entity
 * Common attributes: queue_type, Priority, total_jobs, state_count, enabled, started,
 * resources_min.mem, resources_min.ncpus, resources_assigned.mem, etc.
 */
export interface PbsQueue extends PbsEntity {
  name: string;
}

/**
 * PBS Node entity
 * Common attributes: Mom, ntype, state, state_aux, pcpus, Priority, jobs,
 * resources_available.mem, resources_available.ncpus, resources_assigned.mem, etc.
 */
export interface PbsNode extends PbsEntity {
  name: string; // Node name (e.g., "zenon1")
}

/**
 * PBS Server entity
 * Common attributes: server_state, server_host, scheduling, total_jobs, state_count, pbs_version, etc.
 */
export interface PbsServer extends PbsEntity {
  name: string; // Server name (e.g., "pbs-m1.metacentrum.cz")
}

/**
 * PBS Resource entity
 * Common attributes: type (long, size, string, etc.), flag (h, q, n, m, r, etc.)
 */
export interface PbsResource extends PbsEntity {
  name: string; // Resource name (e.g., "mem", "ncpus")
}

/**
 * PBS Reservation entity
 * Common attributes: Reserve_Name, Reserve_Owner, reserve_state, reserve_start, reserve_end,
 * Resource_List.mem, Resource_List.ncpus, etc.
 */
export interface PbsReservation extends PbsEntity {
  name: string; // Reservation ID
}

/**
 * PBS Scheduler entity
 * Common attributes: sched_host, sched_cycle_length, scheduling, state, partition, etc.
 */
export interface PbsScheduler extends PbsEntity {
  name: string; // Scheduler name (e.g., "default", "elixir")
}

/**
 * PBS Hook entity
 */
export interface PbsHook extends PbsEntity {
  name: string;
}

/**
 * Fairshare entry from default_fairshare.txt
 */
export interface PbsFairshareEntry {
  username: string;
  value1: number;
  value2: number; // The "crazy number" - fairshare value
}

/**
 * Fairshare data for a server
 */
export interface PbsFairshare {
  entries: PbsFairshareEntry[];
}

/**
 * PBS data structure for a single server
 */
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

/**
 * Combined PBS data structure for multiple servers
 * Keyed by server name (e.g., "pbs-m1")
 */
export interface PbsData {
  timestamp: string;
  servers: Record<string, PbsServerData>;
}
