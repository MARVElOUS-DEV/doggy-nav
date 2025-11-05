import type { Context } from 'hono';
import { enforceClientSecret, type ClientSecretGuardConfig } from 'doggy-nav-core';
import { responses } from '../utils/responses';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';

export function clientSecretGuard() {
  return async (c: Context, next: () => Promise<void>) => {
    const cfg: ClientSecretGuardConfig = {
      requireForAllAPIs: (c.env as any)?.REQUIRE_CLIENT_SECRET === 'true',
      bypassRoutes: String((c.env as any)?.CLIENT_SECRET_BYPASS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        // Always allow verification endpoint
        .concat(['/api/application/verify-client-secret']),
      headerName: ((c.env as any)?.CLIENT_SECRET_HEADER as string) || 'x-client-secret',
    };

    const headers: Record<string, string | undefined> = {};
    // Normalize headers into lower-case keys
    for (const [k, v] of Object.entries(c.req.header())) headers[k.toLowerCase()] = v as string;

    const di = getDI(c);
    const appSvc = di.resolve(TOKENS.ApplicationService) as any;

    const res = await enforceClientSecret({
      url: c.req.path + (c.req.query() ? '?' + new URLSearchParams(c.req.query()).toString() : ''),
      headers,
      config: cfg,
      validate: async (secret) => {
        const valid = await appSvc.verifyClientSecret(secret);
        if (!valid) return { valid };
        // Try load app info via repository behind service if available
        try {
          const app = await appSvc.repo?.getByClientSecret?.(secret);
          if (app) return { valid: true, app: { id: app.id, name: app.name } };
        } catch {}
        return { valid: true };
      },
    });

    if (!res.ok) return c.json(responses.err(res.message), res.code as any);
    if (res.appInfo) c.set('clientApplication', res.appInfo);
    await next();
  };
}
