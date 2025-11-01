/**
 * Localized string with Czech and English translations
 */
export interface LocalizedString {
  cs: string;
  en: string;
}

/**
 * Perun Machine (individual machine within a resource)
 */
export interface PerunMachine {
  cpu: number;
  name: string;
}

/**
 * Perun Resource (cluster or computing resource)
 */
export interface PerunResource {
  id: string;
  name: string;
  cluster: string; // "true" or "false" as string
  desc: LocalizedString;
  spec: LocalizedString;
  cpudesc: string | null;
  gpudesc: string | null;
  photo: string | null;
  thumbnail: string | null;
  memory: string;
  disk: LocalizedString;
  network: LocalizedString;
  comment: LocalizedString;
  owner: LocalizedString;
  vos: string[];
  machines: PerunMachine[];
}

/**
 * Perun Physical Machine (organization/institution)
 */
export interface PerunPhysicalMachine {
  id: string;
  name: LocalizedString;
  resources: PerunResource[];
}

/**
 * Perun Machines data structure
 */
export interface PerunMachines {
  frontends: unknown[]; // Typically empty, structure unknown
  physical_machines: PerunPhysicalMachine[];
}

/**
 * Perun VOS (Virtual Organization) information
 */
export interface PerunVosInfo {
  expires: string; // Date string (YYYY-MM-DD)
  groups: string[];
  org: string;
  status: 'VALID' | 'EXPIRED' | string;
}

/**
 * Perun User VOS mapping
 */
export interface PerunUserVos {
  [vosName: string]: PerunVosInfo;
}

/**
 * Perun User Publications mapping
 */
export interface PerunUserPublications {
  [publicationName: string]: string;
}

/**
 * Perun User
 */
export interface PerunUser {
  logname: string;
  name: string;
  org: string;
  publications: PerunUserPublications | null;
  vos: PerunUserVos;
}

/**
 * Perun Users data structure
 */
export interface PerunUsers {
  users: PerunUser[];
}

/**
 * Etc Group entry (parsed from /etc/group format)
 */
export interface EtcGroupEntry {
  groupname: string;
  password: string;
  gid: string;
  members: string[];
}

/**
 * Etc Groups mapping by server name
 */
export interface PerunEtcGroups {
  [serverName: string]: EtcGroupEntry[];
}

/**
 * Combined Perun data structure
 */
export interface PerunData {
  timestamp: string;
  machines: PerunMachines | null;
  users: PerunUsers | null;
  etcGroups: PerunEtcGroups;
}
