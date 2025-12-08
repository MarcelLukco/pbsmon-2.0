import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-openidconnect';
import { OidcConfig } from '@/config/oidc.config';
import axios from 'axios';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(private configService: ConfigService) {
    const oidcConfig = configService.get<OidcConfig>('oidc')!;

    if (
      !oidcConfig.issuer ||
      !oidcConfig.clientId ||
      !oidcConfig.clientSecret
    ) {
      // If OIDC is not configured, create a dummy strategy that will fail gracefully
      super({
        issuer: 'https://dummy',
        authorizationURL: 'https://dummy/authorize',
        tokenURL: 'https://dummy/token',
        userInfoURL: 'https://dummy/userinfo',
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL: '/login',
        scope: 'openid profile email',
      });
      return;
    }

    // Extract callback path from redirect URI (nginx strips /api prefix)
    // If redirectUri is https://domain.com/api/login, the backend receives /login
    let callbackPath = '/login';
    if (oidcConfig.redirectUri) {
      try {
        const url = new URL(oidcConfig.redirectUri);
        callbackPath = url.pathname.replace(/^\/api/, '') || '/login';
      } catch {
        // If redirectUri is not a full URL, use it as-is
        callbackPath = oidcConfig.redirectUri.replace(/^\/api/, '') || '/login';
      }
    }

    // Build OIDC endpoints from issuer
    const issuer = oidcConfig.issuer.endsWith('/')
      ? oidcConfig.issuer.slice(0, -1)
      : oidcConfig.issuer;

    super({
      issuer: issuer,
      authorizationURL: `${issuer}/authorize`,
      tokenURL: `${issuer}/token`,
      userInfoURL: `${issuer}/userinfo`,
      clientID: oidcConfig.clientId,
      clientSecret: oidcConfig.clientSecret,
      callbackURL: callbackPath,
      scope: 'openid profile email',
    });
  }

  async validate(issuer: string, sub: string, profile: any, tokens: any) {
    // This method is called after successful authentication
    // Return user object that will be attached to request.user
    return {
      sub,
      id: sub,
      username: profile.preferred_username || profile.email || sub,
      email: profile.email,
      name: profile.name,
      groups: profile.groups || [],
      roles: profile.roles || [],
      tokens, // Store tokens for later use
      ...profile, // Include all profile data
    };
  }
}
