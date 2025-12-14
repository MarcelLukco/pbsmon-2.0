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
        scope: 'openid profile eduperson_entitlement',
      });
      return;
    }

    const callbackURL =
      oidcConfig.redirectUri ||
      'https://mu-pub-245-82.flt.openstack.cloud.e-infra.cz/api/login';

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
      callbackURL: callbackURL,
      scope: 'openid profile eduperson_entitlement',
    });
  }

  async validate(issuer: string, sub: string, profile: any, tokens: any) {
    // This method is called after successful authentication
    // Return user object that will be attached to request.user
    // eduperson_entitlement is typically an array of entitlement strings
    const entitlements = profile.eduperson_entitlement || [];

    return {
      sub,
      id: sub,
      username: profile.preferred_username || profile.email || sub,
      email: profile.email,
      name: profile.name,
      groups: profile.groups || [],
      roles: profile.roles || [],
      entitlements, // eduperson_entitlement from OIDC
      eduperson_entitlement: entitlements, // Keep original field name too
      tokens, // Store tokens for later use
      ...profile, // Include all profile data
    };
  }
}
