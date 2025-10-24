import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { RawAxiosRequestHeaders } from 'axios';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3002';
const SERVER_CLIENT_SECRET = process.env.SERVER_CLIENT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const headers: RawAxiosRequestHeaders = {
    'Content-Type': 'application/json',
    'X-App-Source': 'main',
  };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  if (req.headers.cookie) headers.Cookie = req.headers.cookie as string;
  if (SERVER_CLIENT_SECRET) headers['x-client-secret'] = SERVER_CLIENT_SECRET;

  try {
    if (req.method === 'PUT') {
      const url = `${SERVER_URL}/api/favorites/folders/${id}`;
      const resp = await axios.put(url, req.body ?? {}, { headers, withCredentials: true });
      return res.status(resp.status).json(resp.data);
    }
    if (req.method === 'DELETE') {
      const url = `${SERVER_URL}/api/favorites/folders/${id}`;
      const resp = await axios.delete(url, { headers, withCredentials: true });
      return res.status(resp.status).json(resp.data);
    }
    return res.status(405).json({ code: 0, message: 'Method not allowed', success: false });
  } catch (error: any) {
    const ep = `${SERVER_URL}/api/favorites/folders/${id}`;
    console.error(`${ep} proxy error:`, error);
    if (error.response) return res.status(error.response.status).json(error.response.data);
    return res.status(500).json({ code: 0, message: 'Server connection failed', success: false });
  }
}
