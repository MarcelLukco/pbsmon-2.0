/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * User context for access control checking
 * Contains essential user information extracted from access token
 */
export interface UserContext {
  username: string;
  role: UserRole;
  groups?: string[]; // Derived from role/username if needed
  hostname?: string; // Derived from role/username if needed
}
