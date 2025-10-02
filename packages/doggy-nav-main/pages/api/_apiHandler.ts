import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3002';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiConfig {
  method: HttpMethod;
  endpoint: string;
  paramName?: string;
  paramNames?: string[];
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

      let response;
      if (config.paramNames) {
        // Handle multiple parameter requests (GET with multiple query params)
        const params: Record<string, any> = {};
        config.paramNames.forEach(paramName => {
          if (req.query[paramName] !== undefined) {
            params[paramName] = req.query[paramName];
          }
        });
        response = await axios[config.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
          `${SERVER_URL}${config.endpoint}`,
          {
            headers,
            params
          }
        );
      } else if (config.paramName) {
        // Handle single parameterized requests (GET with query params)
        const paramValue = req.query[config.paramName];
        response = await axios[config.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
          `${SERVER_URL}${config.endpoint}`,
          {
            headers,
            params: { [config.paramName]: paramValue }
          }
        );
      } else if (req.method === 'GET') {
        // Handle simple GET requests
        response = await axios.get(`${SERVER_URL}${config.endpoint}`, {
          headers,
        });
      } else {
        // Handle POST/PUT/DELETE with body
        response = await axios[req.method.toLowerCase() as 'post' | 'put' | 'delete'](
          `${SERVER_URL}${config.endpoint}`,
          req.body,
          { headers }
        );
      }

      return res.status(response.status).json(response.data);

    } catch (error: any) {
      console.error(`${config.endpoint} proxy error:`, error);

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