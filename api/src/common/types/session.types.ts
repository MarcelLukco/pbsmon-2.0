// Extend Express Session type to include user data
// This must be imported before any code that uses req.session.user
declare module 'express-session' {
  export interface SessionData {
    user?: {
      id?: string;
      sub?: string;
      username?: string;
      email?: string;
      name?: string;
      groups?: string[];
      roles?: string[];
      [key: string]: any;
    };
  }
}
