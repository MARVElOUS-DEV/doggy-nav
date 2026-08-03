import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getSafeAuthRedirect } from '../src/utils/authRedirect';

const DOGGY_SERVER = process.env.DOGGY_SERVER || 'http://localhost:3002';
const DOGGY_SERVER_CLIENT_SECRET = process.env.DOGGY_SERVER_CLIENT_SECRET;
const OAUTH_RETURN_COOKIE = 'doggy_oauth_return_to';
const SECURE_COOKIE_ATTRIBUTE = process.env.NODE_ENV === 'production' ? '; Secure' : '';

const createReturnCookie = (redirect: string, maxAge: number) =>
  `${OAUTH_RETURN_COOKIE}=${encodeURIComponent(redirect)}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${SECURE_COOKIE_ATTRIBUTE}`;

const setResponseCookies = (
  res: NextApiResponse,
  upstreamCookies: string[] | undefined,
  localCookie?: string
) => {
  const cookies = [...(upstreamCookies || []), ...(localCookie ? [localCookie] : [])];
  if (cookies.length > 0) res.setHeader('set-cookie', cookies);
};

const getOAuthErrorRedirect = (location: string): string | undefined => {
  try {
    if (location.startsWith('/') && !location.startsWith('//')) {
      const hashIndex = location.indexOf('#');
      const withoutHash = hashIndex >= 0 ? location.slice(0, hashIndex) : location;
      const queryIndex = withoutHash.indexOf('?');
      const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
      const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';

      return pathname === '/login' && new URLSearchParams(search).has('err')
        ? `/login${search}`
        : undefined;
    }

    const url = new URL(location);
    return url.pathname === '/login' && url.searchParams.has('err')
      ? `/login${url.search}`
      : undefined;
  } catch {
    return undefined;
  }
};

const readReturnCookie = (value: string | undefined) => {
  if (!value || value.startsWith('/')) return value;

  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
};

const buildHeaders = (req: NextApiRequest) => ({
  ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
  ...(DOGGY_SERVER_CLIENT_SECRET ? { 'x-client-secret': DOGGY_SERVER_CLIENT_SECRET } : {}),
  'X-App-Source': 'main',
});

export function createOAuthInitHandler(provider: string) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ code: 0, message: 'Method not allowed', success: false });
    }

    try {
      const returnTo = getSafeAuthRedirect(req.query.redirect);
      const response = await axios.get(`${DOGGY_SERVER}/api/auth/${provider}`, {
        headers: buildHeaders(req),
        maxRedirects: 0,
        validateStatus: () => true,
        withCredentials: true,
        timeout: process.env.NODE_ENV === 'development' ? 0 : 30000,
      });

      const setCookie = response.headers['set-cookie'];
      setResponseCookies(res, setCookie, createReturnCookie(returnTo, 600));

      if (response.status === 302 || response.status === 307) {
        const location = response.headers.location;
        if (location) {
          res.writeHead(response.status, { Location: location });
          return res.end();
        }
      }

      return res.status(response.status).send(response.data);
    } catch (e) {
      return res.status(500).json({ code: 0, message: 'OAuth init failed', success: false });
    }
  };
}

export function createOAuthCallbackHandler(provider: string) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ code: 0, message: 'Method not allowed', success: false });
    }

    try {
      const qs = req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      const url = `${DOGGY_SERVER}/api/auth/${provider}/callback${qs}`;

      const response = await axios.get(url, {
        headers: buildHeaders(req),
        maxRedirects: 0,
        validateStatus: () => true,
        withCredentials: true,
        timeout: process.env.NODE_ENV === 'development' ? 0 : 30000,
      });

      const setCookie = response.headers['set-cookie'];
      const returnTo = getSafeAuthRedirect(readReturnCookie(req.cookies[OAUTH_RETURN_COOKIE]));
      setResponseCookies(res, setCookie, createReturnCookie('', 0));

      if (response.status === 302 || response.status === 307) {
        const location = response.headers.location || '/';
        const destination = getOAuthErrorRedirect(location) || returnTo;
        res.writeHead(response.status, { Location: destination });
        return res.end();
      }

      return res.status(response.status).send(response.data);
    } catch (e) {
      return res.status(500).json({ code: 0, message: 'OAuth callback failed', success: false });
    }
  };
}
