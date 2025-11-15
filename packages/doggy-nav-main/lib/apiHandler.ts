import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosRequestConfig } from 'axios';

const DOGGY_SERVER = process.env.DOGGY_SERVER || 'http://localhost:3002';
const DOGGY_SERVER_CLIENT_SECRET = process.env.DOGGY_SERVER_CLIENT_SECRET;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiConfig {
  method: HttpMethod;
  endpoint?: string; // optional if buildUrl provided
  paramName?: string;
  paramNames?: string[];
  buildUrl?: (req: NextApiRequest) => string; // build path with dynamic segments
}

export const createApiHandler = (config: ApiConfig) => {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== config.method) {
      return res.status(405).json({
        code: 0,
        message: 'Method not allowed',
        success: false,
      });
    }

    try {
      const headers: any = {
        'Content-Type': 'application/json',
        'X-App-Source': 'main',
      };

      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }

      if (req.headers.cookie) {
        headers.Cookie = req.headers.cookie;
      }

      if (DOGGY_SERVER_CLIENT_SECRET) {
        headers['x-client-secret'] = DOGGY_SERVER_CLIENT_SECRET;
      }

      const method = req.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
      const targetPath = config.buildUrl ? config.buildUrl(req) : config.endpoint || '';
      const url = `${DOGGY_SERVER}${targetPath}`;

      // Collect query params if specified
      let params: Record<string, any> | undefined;
      if (config.paramNames) {
        params = {};
        config.paramNames.forEach((paramName) => {
          if (req.query[paramName] !== undefined) {
            params![paramName] = req.query[paramName];
          }
        });
      } else if (config.paramName) {
        params = { [config.paramName]: req.query[config.paramName] } as Record<string, any>;
      }

      let response;
      const axiosConfig: AxiosRequestConfig = {
        headers,
        params,
        withCredentials: true,
      };
      if (process.env.NODE_ENV === 'development') {
        axiosConfig.timeout = 0;
      }

      if (method === 'get') {
        response = await axios.get(url, axiosConfig);
      } else {
        const body = req.body ? req.body : {};
        response = await axios[method](url, body, axiosConfig);
      }

      const setCookie = response.headers?.['set-cookie'];
      if (setCookie) {
        res.setHeader('set-cookie', setCookie);
      }

      if (response.status === 204) {
        res.status(204).end();
        return;
      }

      return res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(
        `${DOGGY_SERVER}${config.endpoint || config.buildUrl?.(req as any) || ''} proxy error:`,
        error
      );

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
  };
};
