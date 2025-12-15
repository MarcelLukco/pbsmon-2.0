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
