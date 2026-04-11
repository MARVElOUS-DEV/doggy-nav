import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DOGGY_SERVER = process.env.DOGGY_SERVER || 'http://localhost:3002';
const DOGGY_SERVER_CLIENT_SECRET = process.env.DOGGY_SERVER_CLIENT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      code: 0,
      message: 'Method not allowed',
      success: false,
    });
  }

  try {
    const headers: Record<string, string> = {
      'X-App-Source': 'main',
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    if (req.headers['x-forwarded-proto']) {
      headers['X-Forwarded-Proto'] = String(req.headers['x-forwarded-proto']);
    }
    if (req.headers.host) {
      headers['X-Forwarded-Host'] = String(req.headers.host);
    }
    if (DOGGY_SERVER_CLIENT_SECRET) {
      headers['x-client-secret'] = DOGGY_SERVER_CLIENT_SECRET;
    }

    const url = new URL(
      `/api/tool-outputs/converter/published/${req.query.publishId}`,
      DOGGY_SERVER
    );

    Object.entries(req.query).forEach(([key, value]) => {
      if (key === 'publishId' || value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item));
        return;
      }
      url.searchParams.set(key, value);
    });

    const response = await axios.get(url.toString(), {
      headers,
      responseType: 'text',
      validateStatus: () => true,
    });

    const wwwAuthenticate = response.headers['www-authenticate'];
    if (wwwAuthenticate) {
      res.setHeader('WWW-Authenticate', wwwAuthenticate);
    }
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['cache-control']) {
      res.setHeader('Cache-Control', response.headers['cache-control']);
    }

    if (response.status >= 400) {
      return res.status(response.status).send(response.data);
    }

    return res.status(response.status).send(response.data);
  } catch {
    return res.status(500).json({
      code: 0,
      message: 'Server connection failed',
      success: false,
    });
  }
}
