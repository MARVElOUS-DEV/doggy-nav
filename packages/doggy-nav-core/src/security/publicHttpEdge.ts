import {
  isPublicIp,
  requestPublicHttp,
  UnsafePublicUrlError,
  type PublicHttpOptions,
  type PublicHttpTransport,
} from './publicHttp';

/** Edge fetch cannot supply a socket lookup; check public DNS before each hop.
 * Deploy with public-internet egress only (no private-network/VPC fetch binding).
 * Node deployments must use publicHttpNode for DNS pinning.
 */
export function requestPublicHttpEdge(
  url: string,
  options: PublicHttpOptions = {},
  fetchImpl: typeof fetch = fetch
) {
  const transport: PublicHttpTransport = async (target, opts) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
    try {
      const host = target.hostname.replace(/^\[|\]$/g, '');
      if (!host.includes(':') && !/^[\d.]+$/.test(host)) {
        const answers = await Promise.all(
          ['A', 'AAAA'].map(async (type) => {
            const query = new URL('https://cloudflare-dns.com/dns-query');
            query.searchParams.set('name', host);
            query.searchParams.set('type', type);
            const response = await fetchImpl(query.href, {
              headers: { Accept: 'application/dns-json' },
              signal: controller.signal,
              redirect: 'error',
            });
            if (!response.ok) throw new UnsafePublicUrlError();
            const data = (await response.json()) as {
              Status: number;
              Answer?: Array<{ type: number; data: string }>;
            };
            if (data.Status !== 0) throw new UnsafePublicUrlError();
            return (data.Answer ?? [])
              .filter((a) => a.type === 1 || a.type === 28)
              .map((a) => a.data);
          })
        );
        const addresses = answers.flat();
        if (!addresses.length || addresses.some((ip) => !isPublicIp(ip)))
          throw new UnsafePublicUrlError();
      }
      const response = await fetchImpl(target.href, {
        method: opts.method,
        headers: opts.headers,
        signal: controller.signal,
        redirect: 'manual',
      });
      const result = {
        status: response.status,
        body: '',
        location: response.headers.get('location') ?? undefined,
      };
      if (opts.method === 'HEAD' || [301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();
        return result;
      }
      const reader = response.body?.getReader();
      if (!reader) return result;
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > opts.maxBytes) throw new Error('Public HTTP response exceeds size limit');
          chunks.push(value);
        }
      } finally {
        await reader.cancel();
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      result.body = new TextDecoder().decode(bytes);
      return result;
    } finally {
      clearTimeout(timer);
    }
  };
  return requestPublicHttp(url, transport, options);
}
