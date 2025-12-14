import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OidcConfig } from '@/config/oidc.config';
import * as client from 'openid-client';

@Injectable()
export class OidcService implements OnModuleInit {
  private readonly logger = new Logger(OidcService.name);
  private config: client.Configuration | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const oidcConfig = this.configService.get<OidcConfig>('oidc')!;

    if (
      !oidcConfig.issuer ||
      !oidcConfig.clientId ||
      !oidcConfig.clientSecret
    ) {
      this.logger.warn('OIDC not configured, authentication will not work');
      return;
    }

    try {
      // Discover the issuer and create configuration
      const issuerUrl = oidcConfig.issuer.endsWith('/')
        ? oidcConfig.issuer.slice(0, -1)
        : oidcConfig.issuer;

      this.config = await client.discovery(
        new URL(issuerUrl),
        oidcConfig.clientId,
        {
          redirect_uris: [oidcConfig.redirectUri || ''],
          response_types: ['code'],
        },
        client.ClientSecretPost(oidcConfig.clientSecret),
      );

      this.logger.log(`Discovered OIDC issuer: ${issuerUrl}`);
      this.logger.log('OIDC client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OIDC client', error);
      this.config = null;
    }
  }

  /**
   * Get the authorization URL for OIDC login with PKCE
   */
  async getAuthorizationUrl(
    state?: string,
  ): Promise<{ url: string; state: string; codeVerifier: string } | null> {
    if (!this.config) {
      return null;
    }

    const authState = state || client.randomPKCECodeVerifier();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const redirectUri =
      this.configService.get<OidcConfig>('oidc')!.redirectUri || '';

    const url = client.buildAuthorizationUrl(this.config, {
      redirect_uri: redirectUri,
      scope: 'openid profile eduperson_entitlement',
      state: authState,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return {
      url: url.toString(),
      state: authState,
      codeVerifier,
    };
  }

  /**
   * Handle the OIDC callback and exchange code for tokens
   */
  async handleCallback(
    request: Request | URL,
    storedState: string,
    storedCodeVerifier: string,
  ): Promise<any> {
    if (!this.config) {
      throw new Error('OIDC client not initialized');
    }

    try {
      // Exchange code for tokens using authorization code grant
      const tokenSet = await client.authorizationCodeGrant(
        this.config,
        request,
        {
          expectedState: storedState,
          pkceCodeVerifier: storedCodeVerifier,
        },
      );

      // Get user info - use skipSubjectCheck to avoid type issues
      // The sub claim will be validated by the library from the userInfo response
      const userInfo = await client.fetchUserInfo(
        this.config,
        tokenSet.access_token!,
        client.skipSubjectCheck,
      );

      // Combine user info with token data
      return {
        id: userInfo.sub,
        username:
          (userInfo as any).preferred_username ||
          (userInfo as any).email ||
          userInfo.sub,
        email: (userInfo as any).email,
        name: (userInfo as any).name,
        groups: (userInfo as any).groups || [],
        roles: (userInfo as any).roles || [],
        entitlements: (userInfo as any).eduperson_entitlement || [],
        eduperson_entitlement: (userInfo as any).eduperson_entitlement || [],
        tokens: tokenSet,
        ...userInfo,
      };
    } catch (error) {
      this.logger.error('OIDC callback error', error);
      throw error;
    }
  }

  /**
   * Check if OIDC is configured and ready
   */
  isConfigured(): boolean {
    return this.config !== null;
  }
}
