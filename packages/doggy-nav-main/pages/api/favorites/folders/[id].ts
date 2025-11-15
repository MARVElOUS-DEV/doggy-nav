import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { RawAxiosRequestHeaders } from 'axios';

const DOGGY_SERVER = process.env.DOGGY_SERVER || 'http://localhost:3002';
const DOGGY_SERVER_CLIENT_SECRET = process.env.DOGGY_SERVER_CLIENT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const headers: RawAxiosRequestHeaders = {
    'Content-Type': 'application/json',
    'X-App-Source': 'main',
  };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  if (req.headers.cookie) headers.Cookie = req.headers.cookie as string;
  if (DOGGY_SERVER_CLIENT_SECRET) headers['x-client-secret'] = DOGGY_SERVER_CLIENT_SECRET;

  try {
    if (req.method === 'PUT') {
      const url = `${DOGGY_SERVER}/api/favorites/folders/${id}`;
      const resp = await axios.put(url, req.body ?? {}, { headers, withCredentials: true });
      return res.status(resp.status).json(resp.data);
    }
    if (req.method === 'DELETE') {
      const url = `${DOGGY_SERVER}/api/favorites/folders/${id}`;
      const resp = await axios.delete(url, { headers, withCredentials: true });
      return res.status(resp.status).json(resp.data);
    }
    return res.status(405).json({ code: 0, message: 'Method not allowed', success: false });
  } catch (error: any) {
    const ep = `${DOGGY_SERVER}/api/favorites/folders/${id}`;
    console.error(`${ep} proxy error:`, error);
    if (error.response) return res.status(error.response.status).json(error.response.data);
    return res.status(500).json({ code: 0, message: 'Server connection failed', success: false });
  }
}
