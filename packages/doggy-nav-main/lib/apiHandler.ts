import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3002';
const SERVER_CLIENT_SECRET = process.env.SERVER_CLIENT_SECRET;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiConfig {
  method: HttpMethod;
  endpoint?: string; // optional if buildUrl provided
  paramName?: string;
  paramNames?: string[];
  buildUrl?: (req: NextApiRequest) => string; // build path with dynamic segments
}

export const createApiHandler = (config: ApiConfig) => {
  return async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    if (req.method !== config.method) {
      return res.status(405).json({
        code: 0,
        message: 'Method not allowed',
        success: false
      });
    }

    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      if (SERVER_CLIENT_SECRET) {
        headers['x-client-secret'] = SERVER_CLIENT_SECRET;
      }

      const method = req.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
      const targetPath = config.buildUrl ? config.buildUrl(req) : (config.endpoint || '');
      const url = `${SERVER_URL}${targetPath}`;

      // Collect query params if specified
      let params: Record<string, any> | undefined;
      if (config.paramNames) {
        params = {};
        config.paramNames.forEach(paramName => {
          if (req.query[paramName] !== undefined) {
            params![paramName] = req.query[paramName];
          }
        });
      } else if (config.paramName) {
        params = { [config.paramName]: req.query[config.paramName] } as Record<string, any>;
      }

      let response;
      if (method === 'get') {
        response = await axios.get(url, { headers, params });
      } else {
        response = await axios[method](url, req.body?req.body: JSON.stringify({}), { headers, params });
      }

      return res.status(response.status).json(response.data);

    } catch (error: any) {
      console.error(`${SERVER_URL}${config.endpoint || config.buildUrl?.(req as any) || ''} proxy error:`, error);

      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }

      return res.status(500).json({
        code: 0,
        message: 'Server connection failed',
        success: false
      });
    }
  };
};