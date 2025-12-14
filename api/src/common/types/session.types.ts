// Extend Express Session type to include user data
// This must be imported before any code that uses req.session.user
declare module 'express-session' {
  export interface SessionData {
    user?: {
      id?: string;
      username?: string;
      name?: string;
      role?: string;
      [key: string]: any;
    };
    oidcState?: string;
    oidcCodeVerifier?: string;
  }
}
