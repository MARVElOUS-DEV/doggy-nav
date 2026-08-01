import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const DOGGY_SERVER = process.env.DOGGY_SERVER || 'http://localhost:3002';
const DOGGY_SERVER_CLIENT_SECRET = process.env.DOGGY_SERVER_CLIENT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'PUT', 'DELETE'].includes(req.method || '')) {
    return res.status(405).json({
      code: 0,
      message: 'Method not allowed',
      success: false,
    });
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-App-Source': 'main',
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    if (req.headers.cookie) {
      headers.Cookie = req.headers.cookie;
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

    const url = `${DOGGY_SERVER}/api/tool-outputs/converter`;

    let response;
    if (req.method === 'GET') {
      response = await axios.get(url, { headers, withCredentials: true });
    } else if (req.method === 'PUT') {
      response = await axios.put(url, req.body || {}, { headers, withCredentials: true });
    } else {
      response = await axios.delete(url, {
        headers,
        params: req.query,
        withCredentials: true,
      });
    }

    const setCookie = response.headers?.['set-cookie'];
    if (setCookie) {
      res.setHeader('set-cookie', setCookie);
    }

    return res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      const setCookie = error.response.headers?.['set-cookie'];
      if (setCookie) {
        res.setHeader('set-cookie', setCookie);
      }
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      code: 0,
      message: 'Server connection failed',
      success: false,
    });
  }
}
