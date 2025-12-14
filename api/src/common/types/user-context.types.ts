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
  id: string;
  username: string;
  role: UserRole;
}
