export interface ClientSecretGuardConfig {
  requireForAllAPIs: boolean;
  bypassRoutes?: string[];
  headerName?: string; // default 'x-client-secret'
}

export interface ClientAppInfo {
  id: string;
  name: string;
  authType: 'client_secret';
}

export type ValidateClientSecret = (
  secret: string
) => Promise<{ valid: boolean; app?: { id: string; name: string } | null }>;

export function normalizePath(original: string) {
  const i = original.indexOf('?');
  return i >= 0 ? original.slice(0, i) : original;
}

export function matchesBypass(url: string, routes: string[] = []) {
  return routes.some((route) => {
    if (route === url) return true;
    const r = route.split('/');
    const u = url.split('/');
    if (r.length !== u.length) return false;
    return r.every((part, i) => part.startsWith(':') || part === u[i]);
  });
}

export function extractClientSecret(
  headers: Record<string, string | undefined>,
  headerName = 'x-client-secret'
) {
  const key = headerName.toLowerCase();
  // Normalize header keys to lowercase
  const value = headers[key] ?? headers[headerName] ?? headers[headerName.toLowerCase()];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function enforceClientSecret(
  input: {
    url: string;
    headers: Record<string, string | undefined>;
    config: ClientSecretGuardConfig;
    validate: ValidateClientSecret;
  }
): Promise<{ ok: true; appInfo?: ClientAppInfo } | { ok: false; code: number; message: string }> {
  const { url, headers, config, validate } = input;
  const required = Boolean(config.requireForAllAPIs);
  const bypass = Array.isArray(config.bypassRoutes) ? config.bypassRoutes! : [];
  if (!required) return { ok: true };
  const path = normalizePath(url);
  if (matchesBypass(path, bypass)) return { ok: true };

  const header = (config.headerName || 'x-client-secret').toLowerCase();
  const clientSecret = extractClientSecret(headers, header);
  if (!clientSecret) return { ok: false, code: 401, message: '请提供客户端密钥' };

  try {
    const res = await validate(clientSecret);
    if (!res?.valid) return { ok: false, code: 401, message: '无效的客户端密钥' };
    const app = res.app;
    const appInfo: ClientAppInfo | undefined = app
      ? { id: String(app.id), name: app.name, authType: 'client_secret' }
      : undefined;
    return appInfo ? { ok: true, appInfo } : { ok: true };
  } catch {
    return { ok: false, code: 500, message: '客户端密钥验证失败' };
  }
}
