import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  roles: string[];
  roleIds: string[];
  groups: string[];
  groupIds: string[];
  permissions: string[];
  typ?: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  tokenId: string;
  source: 'main' | 'admin';
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresAt: number;
}

export interface RefreshTokenOptions {
  sessionId: string;
  tokenId: string;
  source: 'main' | 'admin';
}

export class JWTUtils {
  private static readonly ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000;
  private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

  private readonly key: Uint8Array;

  constructor(secret: string) {
    this.key = new TextEncoder().encode(secret);
  }

  async generateTokenPair(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'typ'>,
    options: RefreshTokenOptions = {
      sessionId: crypto.randomUUID(),
      tokenId: crypto.randomUUID(),
      source: 'main',
    }
  ): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);
    const accessTokenExpiry = now + Math.floor(JWTUtils.ACCESS_TOKEN_EXPIRY / 1000);
    const refreshTokenExpiry = now + Math.floor(JWTUtils.REFRESH_TOKEN_EXPIRY / 1000);

    const accessToken = await new SignJWT({ ...payload, typ: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(accessTokenExpiry)
      .sign(this.key);

    const refreshToken = await new SignJWT({
      typ: 'refresh',
      sid: options.sessionId,
      source: options.source,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.userId)
      .setJti(options.tokenId)
      .setIssuedAt(now)
      .setExpirationTime(refreshTokenExpiry)
      .sign(this.key);

    return {
      accessToken,
      refreshToken,
      expiresIn: JWTUtils.ACCESS_TOKEN_EXPIRY,
      refreshExpiresAt: refreshTokenExpiry * 1000,
    };
  }

  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: ['HS256'],
        clockTolerance: 60,
      });
      if (payload.typ !== 'access' || typeof payload.userId !== 'string') return null;

      return {
        typ: 'access',
        userId: payload.userId,
        email: payload.email as string,
        username: payload.username as string,
        roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
        roleIds: Array.isArray(payload.roleIds) ? (payload.roleIds as string[]) : [],
        groups: Array.isArray(payload.groups) ? (payload.groups as string[]) : [],
        groupIds: Array.isArray(payload.groupIds) ? (payload.groupIds as string[]) : [],
        permissions: Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [],
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: ['HS256'],
        clockTolerance: 60,
      });
      if (
        payload.typ !== 'refresh' ||
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string' ||
        typeof payload.jti !== 'string' ||
        (payload.source !== 'main' && payload.source !== 'admin')
      ) {
        return null;
      }
      return {
        userId: payload.sub,
        sessionId: payload.sid,
        tokenId: payload.jti,
        source: payload.source,
        exp: payload.exp,
      };
    } catch {
      return null;
    }
  }

  async refreshAccessToken(
    refreshToken: string,
    userPayload: Omit<JWTPayload, 'iat' | 'exp' | 'typ'>
  ): Promise<TokenPair | null> {
    const refreshPayload = await this.verifyRefreshToken(refreshToken);
    if (!refreshPayload || refreshPayload.userId !== userPayload.userId) return null;
    return this.generateTokenPair(userPayload, {
      sessionId: refreshPayload.sessionId,
      tokenId: crypto.randomUUID(),
      source: refreshPayload.source,
    });
  }

  static extractTokenFromHeader(authorizationHeader: string | null): string | null {
    if (!authorizationHeader) return null;
    const parts = authorizationHeader.split(' ');
    return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
  }

  static createPayload(user: {
    id: string;
    email: string;
    username: string;
    roles: string[];
    roleIds: string[];
    groups: string[];
    groupIds: string[];
    permissions: string[];
  }): Omit<JWTPayload, 'iat' | 'exp' | 'typ'> {
    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      roleIds: user.roleIds,
      groups: user.groups,
      groupIds: user.groupIds,
      permissions: user.permissions,
    };
  }

  static isTokenExpired(payload: JWTPayload): boolean {
    return payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : false;
  }

  static getTokenExpiry(payload: JWTPayload): number {
    return payload.exp ? payload.exp * 1000 : 0;
  }

  static hasPermission(payload: JWTPayload, requiredPermission: string): boolean {
    return payload.permissions.includes(requiredPermission) || payload.permissions.includes('*');
  }

  static hasRole(payload: JWTPayload, requiredRole: string): boolean {
    return payload.roles.includes(requiredRole) || payload.roles.includes('sysadmin');
  }

  static isInGroup(payload: JWTPayload, requiredGroup: string): boolean {
    return payload.groups.includes(requiredGroup);
  }
}
