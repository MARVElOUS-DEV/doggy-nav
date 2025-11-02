import { SignJWT, jwtVerify } from 'jose';

interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  roles: string[];
  groups: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JWTUtils {
  private static readonly ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  private secretKey: Uint8Array;

  constructor(secret: string) {
    this.secretKey = new TextEncoder().encode(secret);
  }

  /**
   * Generate a new JWT token pair
   */
  async generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);
    const accessTokenExpiry = now + Math.floor(JWTUtils.ACCESS_TOKEN_EXPIRY / 1000);
    const refreshTokenExpiry = now + Math.floor(JWTUtils.REFRESH_TOKEN_EXPIRY / 1000);

    // Generate access token
    const accessToken = await new SignJWT({
      ...payload,
      iat: now,
      exp: accessTokenExpiry,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(accessTokenExpiry)
      .sign(this.secretKey);

    // Generate refresh token
    const refreshToken = await new SignJWT({
      userId: payload.userId,
      type: 'refresh',
      iat: now,
      exp: refreshTokenExpiry,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(refreshTokenExpiry)
      .sign(this.secretKey);

    return {
      accessToken,
      refreshToken,
      expiresIn: JWTUtils.ACCESS_TOKEN_EXPIRY,
    };
  }

  /**
   * Verify and decode an access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secretKey, {
        algorithms: ['HS256'],
      });

      return {
        userId: payload.userId as string,
        email: payload.email as string,
        username: payload.username as string,
        roles: payload.roles as string[],
        groups: payload.groups as string[],
        permissions: payload.permissions as string[],
        iat: payload.iat as number,
        exp: payload.exp as number,
      };
    } catch (error) {
      console.error('Access token verification failed:', error);
      return null;
    }
  }

  /**
   * Verify and decode a refresh token
   */
  async verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
    try {
      const { payload } = await jwtVerify(token, this.secretKey, {
        algorithms: ['HS256'],
      });

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        userId: payload.userId as string,
      };
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    userPayload: Omit<JWTPayload, 'iat' | 'exp'>
  ): Promise<TokenPair | null> {
    const refreshPayload = await this.verifyRefreshToken(refreshToken);
    if (!refreshPayload || refreshPayload.userId !== userPayload.userId) {
      return null;
    }

    return await this.generateTokenPair(userPayload);
  }

  /**
   * Extract JWT from Authorization header
   */
  static extractTokenFromHeader(authorizationHeader: string | null): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const parts = authorizationHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Create JWT payload from user data
   */
  static createPayload(user: {
    id: string;
    email: string;
    username: string;
    roles: string[];
    groups: string[];
    permissions: string[];
  }): Omit<JWTPayload, 'iat' | 'exp'> {
    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      groups: user.groups,
      permissions: user.permissions,
    };
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(payload: JWTPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp < now : false;
  }

  /**
   * Get token expiry time in milliseconds
   */
  static getTokenExpiry(payload: JWTPayload): number {
    return payload.exp ? payload.exp * 1000 : 0;
  }

  /**
   * Check if user has required permission
   */
  static hasPermission(payload: JWTPayload, requiredPermission: string): boolean {
    return payload.permissions.includes(requiredPermission);
  }

  /**
   * Check if user has required role
   */
  static hasRole(payload: JWTPayload, requiredRole: string): boolean {
    return payload.roles.includes(requiredRole);
  }

  /**
   * Check if user is in required group
   */
  static isInGroup(payload: JWTPayload, requiredGroup: string): boolean {
    return payload.groups.includes(requiredGroup);
  }
}
