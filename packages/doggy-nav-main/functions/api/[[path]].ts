// Cloudflare Pages Function: proxy /api/* to backend and implement Next-only endpoints
export const onRequest = async (context: any) => {
  const { request, env } = context;
  const reqUrl = new URL(request.url);
  const pathAfterApi = reqUrl.pathname.replace(/^\/?api\/?/, '');

  // Special case 1: /api/check-url (Next-only endpoint)
  if (reqUrl.pathname === '/api/check-url') {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const target = reqUrl.searchParams.get('url');
    if (!target) {
      return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(target, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeout);
      const ms = Date.now() - start;
      const isAuth = resp.status === 401 || resp.status === 403;
      const body = JSON.stringify({
        accessible: resp.ok || isAuth,
        status: resp.status,
        responseTime: ms,
      });
      return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      const ms = Date.now() - start;
      const body = JSON.stringify({ accessible: false, status: 0, responseTime: ms });
      return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // Special case 2: /api/news (Next-only endpoint)
  if (reqUrl.pathname === '/api/news') {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ code: 0, message: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    try {
      const source = env.NEWS_SOURCE_URL || 'https://hn.algolia.com/api/v1/search?tags=front_page';
      const upstream = await fetch(source, {
        headers: { Accept: 'application/json' },
      });
      const data = await upstream.json();
      const hits = Array.isArray(data?.hits) ? data.hits : [];
      const items = hits.map((h: any) => {
        const u = h.url || null;
        let domain: string | null = null;
        if (u) {
          try {
            domain = new URL(u).hostname.replace(/^www\./, '');
          } catch {}
        }
        return {
          id: String(h.objectID || h.objectId || h.id || h.title),
          title: h.title || h.story_title || 'Untitled',
          url: u,
          domain,
          points: typeof h.points === 'number' ? h.points : undefined,
          comments: typeof h.num_comments === 'number' ? h.num_comments : undefined,
          author: h.author || undefined,
          createdAt: h.created_at || undefined,
        };
      });
      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ code: 0, message: 'Failed to load news' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Generic proxy for all other /api/* routes → upstream server
  const upstreamBase: string | undefined = env.DOGGY_SERVER || env.API_BASE_URL || env.SERVER;
  if (!upstreamBase) {
    return new Response('Missing upstream: set DOGGY_SERVER (or API_BASE_URL/SERVER)', {
      status: 500,
    });
  }

  const base = upstreamBase.endsWith('/') ? upstreamBase : upstreamBase + '/';
  const targetUrl = base + 'api/' + pathAfterApi + reqUrl.search;

  const headers = new Headers(request.headers);
  headers.set('X-App-Source', 'main');

  const clientSecret = env.DOGGY_SERVER_CLIENT_SECRET;
  if (clientSecret) headers.set('x-client-secret', clientSecret);

  const cfIp = request.headers.get('CF-Connecting-IP') || '';
  const xff = headers.get('x-forwarded-for');
  headers.set('X-Real-IP', cfIp);
  headers.set('X-Forwarded-Proto', reqUrl.protocol.replace(':', ''));
  headers.set('X-Forwarded-Host', reqUrl.host);
  headers.set('X-Forwarded-For', xff ? `${xff}, ${cfIp}` : cfIp);

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
