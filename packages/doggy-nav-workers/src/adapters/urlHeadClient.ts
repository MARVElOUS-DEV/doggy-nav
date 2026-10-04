import type { UrlHeadClient } from 'doggy-nav-core';
import { requestPublicHttpEdge } from 'doggy-nav-core/dist/security/publicHttpEdge';

export class FetchUrlHeadClient implements UrlHeadClient {
  constructor(private readonly opts?: { allowedHosts?: string[] }) {}
  async head(
    url: string,
    options?: { timeoutMs?: number; headers?: Record<string, string> }
  ): Promise<{ ok: boolean; status?: number }> {
    try {
      const res = await requestPublicHttpEdge(url, {
        method: 'HEAD',
        headers: options?.headers,
        timeoutMs: options?.timeoutMs ?? 5000,
        allowUrl: (target) =>
          !this.opts?.allowedHosts?.length ||
          this.opts.allowedHosts.some((pattern) => hostMatches(target.hostname, pattern)),
      });
      return { ok: res.status >= 200 && res.status < 400, status: res.status };
    } catch (e: any) {
      return { ok: false };
    }
  }
}

export default FetchUrlHeadClient;

function hostMatches(host: string, pattern: string): boolean {
  const h = host.toLowerCase();
  const p = pattern.toLowerCase();
  if (p.startsWith('*.')) {
    const suffix = p.slice(1); // '.example.com'
    return h.endsWith(suffix) && h.length > suffix.length; // require subdomain
  }
  return h === p;
}
