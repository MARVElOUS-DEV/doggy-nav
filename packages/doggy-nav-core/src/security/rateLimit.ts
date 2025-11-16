export type RateLimitUserType = 'anonymous' | 'authenticated' | 'admin';

export interface RateLimitEntry {
  limit: number;
  /** Fixed window interval in milliseconds */
  interval: number;
}

export interface RateLimitConfig {
  anonymous: RateLimitEntry;
  authenticated: RateLimitEntry;
  admin: RateLimitEntry;
  routes: Record<string, RateLimitEntry>;
  exemptPaths: string[];
  whitelist?: string[];
  blacklist?: string[];
  enabled?: boolean;
}

export interface RateLimitBucket {
  count: number;
  resetTime: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch millis when this window resets */
  resetTime: number;
  /** Seconds until reset when blocked */
  retryAfterSeconds?: number;
}

export function isExemptPath(path: string, patterns: string[] = []): boolean {
  for (const pattern of patterns) {
    if (!pattern) continue;
    if (pattern === path) return true;
    if (pattern.endsWith('/*')) {
      const base = pattern.slice(0, -2);
      if (path.startsWith(base)) return true;
    }
  }
  return false;
}

export function getUserTypeFromContext(input: {
  hasUser: boolean;
  roles?: string[];
  effectiveRoles?: string[];
}): RateLimitUserType {
  const { hasUser } = input;
  if (!hasUser) return 'anonymous';

  const roles = normalizeRoles(input.roles, input.effectiveRoles);
  if (hasAdminRole(roles)) return 'admin';
  return 'authenticated';
}

export function getRouteLimits(
  path: string,
  config: RateLimitConfig,
  userType: RateLimitUserType
): RateLimitEntry {
  const direct = config.routes[path];
  if (direct) return direct;

  for (const pattern in config.routes) {
    if (!Object.prototype.hasOwnProperty.call(config.routes, pattern)) continue;
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      if (path.startsWith(basePath)) {
        return config.routes[pattern];
      }
    }
  }

  // Fallback to user-type defaults
  return (config as any)[userType] || config.anonymous;
}

export interface RateLimitKeyInput {
  userType: RateLimitUserType;
  userId?: string | number | null;
  ip: string;
}

export function generateRateLimitKey(input: RateLimitKeyInput): string {
  const { userType, userId, ip } = input;
  if (userType === 'anonymous') {
    return `ip:${ip || 'unknown'}`;
  }
  const id = userId != null ? String(userId) : 'unknown';
  return `user:${id}`;
}

export function applyFixedWindow(
  store: Map<string, RateLimitBucket>,
  key: string,
  limits: RateLimitEntry,
  now: number = Date.now()
): RateLimitResult {
  let bucket = store.get(key);

  if (!bucket || now > bucket.resetTime) {
    bucket = {
      count: 1,
      resetTime: now + limits.interval,
    };
    store.set(key, bucket);
  } else {
    bucket.count += 1;
  }

  const limit = limits.limit;
  const remainingRaw = limit - bucket.count;
  const remaining = remainingRaw > 0 ? remainingRaw : 0;
  const allowed = bucket.count <= limit;

  if (!allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetTime - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining,
      resetTime: bucket.resetTime,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    limit,
    remaining,
    resetTime: bucket.resetTime,
  };
}

export function isIpWhitelisted(ip: string, whitelist: string[] | undefined): boolean {
  if (!whitelist || !whitelist.length) return false;
  return whitelist.includes(ip);
}

export function isIpBlacklisted(ip: string, blacklist: string[] | undefined): boolean {
  if (!blacklist || !blacklist.length) return false;
  return blacklist.includes(ip);
}

export const baseRateLimitExemptPaths: string[] = [
  '/health',
  '/api/system/version',
  '/favicon.ico',
];

export const defaultRateLimitRoutes: Record<string, RateLimitEntry> = {
  // Authentication endpoints - stricter limits
  '/api/auth/login': {
    limit: 10,
    interval: 300000, // 5 minutes
  },
  '/api/auth/register': {
    limit: 5,
    interval: 300000, // 5 minutes
  },
  // Password reset
  '/api/auth/reset-password': {
    limit: 3,
    interval: 300000, // 5 minutes
  },
  // Admin operations
  '/api/admin/*': {
    limit: 1000,
    interval: 60000, // 1 minute
  },
};

function normalizeRoles(roles?: string[], effectiveRoles?: string[]): string[] {
  if (Array.isArray(effectiveRoles) && effectiveRoles.length > 0) return effectiveRoles;
  if (Array.isArray(roles)) return roles;
  return [];
}

function hasAdminRole(roles: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((r) => r === 'admin' || r === 'sysadmin');
}
