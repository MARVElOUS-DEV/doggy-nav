import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3002';
const SERVER_CLIENT_SECRET = process.env.SERVER_CLIENT_SECRET;

const buildHeaders = (req: NextApiRequest) => ({
  ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
  ...(SERVER_CLIENT_SECRET ? { 'x-client-secret': SERVER_CLIENT_SECRET } : {}),
  'X-App-Source': 'main',
});

export function createOAuthInitHandler(provider: string) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ code: 0, message: 'Method not allowed', success: false });
    }

    try {
      const response = await axios.get(`${SERVER_URL}/api/auth/${provider}`, {
        headers: buildHeaders(req),
        maxRedirects: 0,
        validateStatus: () => true,
        withCredentials: true,
        timeout: process.env.NODE_ENV === 'development' ? 0 : 30000,
      });

      const setCookie = response.headers['set-cookie'];
      if (setCookie) res.setHeader('set-cookie', setCookie);

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
      const url = `${SERVER_URL}/api/auth/${provider}/callback${qs}`;

      const response = await axios.get(url, {
        headers: buildHeaders(req),
        maxRedirects: 0,
        validateStatus: () => true,
        withCredentials: true,
        timeout: process.env.NODE_ENV === 'development' ? 0 : 30000,
      });

      const setCookie = response.headers['set-cookie'];
      if (setCookie) res.setHeader('set-cookie', setCookie);

      if (response.status === 302 || response.status === 307) {
        const location = response.headers.location || '/';
        res.writeHead(response.status, { Location: location });
        return res.end();
      }

      return res.status(response.status).send(response.data);
    } catch (e) {
      return res.status(500).json({ code: 0, message: 'OAuth callback failed', success: false });
    }
  };
}
