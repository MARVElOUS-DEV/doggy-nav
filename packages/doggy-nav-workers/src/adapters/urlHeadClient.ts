import type { UrlHeadClient } from 'doggy-nav-core';

export class FetchUrlHeadClient implements UrlHeadClient {
  constructor(private readonly opts?: { allowedHosts?: string[] }) {}
  async head(
    url: string,
    options?: { timeoutMs?: number; headers?: Record<string, string> }
  ): Promise<{ ok: boolean; status?: number }> {
    try {
      // Basic SSRF protections: only http/https, disallow private IP literals
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) return { ok: false };
      // Block IPv4 literals to private/link-local/loopback ranges
      const host = u.hostname;
      if (isPrivateHost(host)) return { ok: false };
      if (this.opts?.allowedHosts && this.opts.allowedHosts.length > 0) {
        const allowed = this.opts.allowedHosts.some((p) => hostMatches(host, p));
        if (!allowed) return { ok: false };
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 5000);
      const res = await fetch(url, {
        method: 'HEAD',
        headers: options?.headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return { ok: res.status >= 200 && res.status < 400, status: res.status };
    } catch (e: any) {
      return { ok: false };
    }
  }
}

export default FetchUrlHeadClient;

function isPrivateHost(host: string): boolean {
  // IPv6 literals
  if (host.startsWith('[') && host.endsWith(']')) return true;
  // IPv4 literals
  const m = host.match(/^\d+\.\d+\.\d+\.\d+$/);
  if (!m) return false;
  const parts = host.split('.').map((x) => Number(x));
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0 - 172.31.255.255
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  return false;
}

function hostMatches(host: string, pattern: string): boolean {
  const h = host.toLowerCase();
  const p = pattern.toLowerCase();
  if (p.startsWith('*.')) {
    const suffix = p.slice(1); // '.example.com'
    return h.endsWith(suffix) && h.length > suffix.length; // require subdomain
  }
  return h === p;
}
