import type { AuthRepository, AuthUser } from '../repositories/AuthRepository';

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export interface IssueTokensFn {
  (payload: {
    userId: string;
    username: string;
    roles: string[];
    groups: string[];
    permissions: string[];
  }): Promise<TokenPair>;
}

export class UserAuthService {
  constructor(private readonly repo: AuthRepository) {}

  async login(identifier: string, password: string, issueTokens: IssueTokensFn) {
    const verified = await this.repo.verifyCredentials(identifier, password);
    if (!verified) return null;

    await this.repo.recordSuccessfulLogin(verified.userId);
    const authUser: AuthUser = await this.repo.loadAuthUser(verified.userId);
    const tokens = await issueTokens({
      userId: authUser.id,
      username: authUser.username,
      roles: authUser.roles,
      groups: authUser.groups,
      permissions: authUser.permissions,
    });
    return {
      token: 'Bearer ' + tokens.accessToken,
      tokens,
      user: {
        id: authUser.id,
        username: authUser.username,
        email: authUser.email || undefined,
        avatar: authUser.avatar || undefined,
        roles: authUser.roles,
        groups: authUser.groups,
        permissions: authUser.permissions,
      },
    };
  }
}

export default UserAuthService;
