// Proxy /api/* to upstream and inject required headers (Cloudflare Pages Function)
export const onRequest = async (context: any) => {
  const { request, env } = context;

  const reqUrl = new URL(request.url);
  const upstreamBase: string = env.DOGGY_SERVER;
  if (!upstreamBase) {
    return new Response('Missing DOGGY_SERVER env', { status: 500 });
  }

  // Compute upstream URL: ${DOGGY_SERVER}/api/<path>?<search>
  const base = upstreamBase.endsWith('/') ? upstreamBase : upstreamBase + '/';
  const pathAfterApi = reqUrl.pathname.replace(/^\/api\/?/, '');
  const targetUrl = base + 'api/' + pathAfterApi + reqUrl.search;

  // Clone incoming headers and set proxy headers similar to nginx-admin.conf
  const headers = new Headers(request.headers);

  // IP and forwarding headers
  const cfIp = request.headers.get('CF-Connecting-IP') || '';
  const xff = headers.get('x-forwarded-for');
  headers.set('X-Real-IP', cfIp);
  headers.set('X-Forwarded-Proto', reqUrl.protocol.replace(':', ''));
  headers.set('X-Forwarded-Host', reqUrl.host);
  headers.set('X-Forwarded-For', xff ? `${xff}, ${cfIp}` : cfIp);

  // Inject client secret at proxy layer (never exposed to browser)
  if (env.DOGGY_SERVER_CLIENT_SECRET) {
    headers.set('x-client-secret', env.DOGGY_SERVER_CLIENT_SECRET);
  }

  // Avoid setting restricted hop-by-hop headers; Host will follow target URL automatically
  headers.delete('host');
  headers.delete('connection');
  headers.delete('transfer-encoding');
  headers.delete('upgrade');

  const init: RequestInit = {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual',
  };

  const upstreamResp = await fetch(targetUrl, init);
  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    headers: upstreamResp.headers,
  });
};
