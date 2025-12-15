export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface UserContext {
  id: string;
  username: string;
  role: UserRole;
}
