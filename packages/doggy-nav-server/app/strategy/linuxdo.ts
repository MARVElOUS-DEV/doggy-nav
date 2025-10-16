import OAuth2Strategy, { StrategyOptions as OAuth2StrategyOptions } from 'passport-oauth2';

export interface LinuxDoStrategyOptions extends OAuth2StrategyOptions {
  userProfileURL: string;
}

export interface LinuxDoProfile {
  id?: string;
  username?: string;
  name?: string;
  email?: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
  emails?: Array<{ value?: string; verified?: boolean }>;
  picture?: string | null;
  [key: string]: any;
}

export default class LinuxDoStrategy extends OAuth2Strategy {
  private readonly profileURL: string;

  constructor(
    options: LinuxDoStrategyOptions,
    verify: (accessToken: string, refreshToken: string, profile: any, done: OAuthVerifyCallback) => void,
  ) {
    const { userProfileURL, ...rest } = options;
    super(rest, verify as any);
    (this as any).name = 'linuxdo';
    this.profileURL = userProfileURL;
    (this as any)._oauth2.useAuthorizationHeaderforGET(true);
  }

  userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void) {
    if (!this.profileURL) {
      return done(new Error('LinuxDo userProfileURL is not configured'));
    }

    (this as any)._oauth2.get(this.profileURL, accessToken, (err: Error | null, body: any) => {
      if (err) {
        return done(err);
      }

      try {
        const json: LinuxDoProfile = typeof body === 'string' ? JSON.parse(body) : JSON.parse(body.toString());
        const profile: any = {
          provider: 'linuxdo',
          id: json.id ?? json.user_id ?? json.uid ?? null,
          username: json.username ?? json.login ?? json.name ?? null,
          displayName: json.name ?? json.username ?? null,
          emails: Array.isArray(json.emails)
            ? json.emails
            : json.email
              ? [{ value: json.email, verified: json.email_verified ?? false }]
              : [],
          photos: [],
          _json: json,
        };

        const avatar = json.avatar_url ?? json.avatar ?? json.picture ?? null;
        if (avatar) {
          profile.photos = [{ value: avatar }];
        }

        return done(null, profile);
      } catch (parseError) {
        return done(parseError as Error);
      }
    });
  }
}
