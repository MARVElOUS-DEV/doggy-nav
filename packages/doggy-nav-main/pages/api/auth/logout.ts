import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3002';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 0,
      message: 'Method not allowed',
      success: false
    });
  }

  try {
    // Forward authorization header if present
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Proxy the request to doggy-nav-server
    const response = await axios.post(`${SERVER_URL}/api/auth/logout`, req.body, {
      headers,
    });

    // Forward the response from the server
    return res.status(response.status).json(response.data);

  } catch (error: any) {
    console.error('Logout proxy error:', error);
    
    if (error.response) {
      // Forward the error response from the server
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({
      code: 0,
      message: 'Server connection failed',
      success: false
    });
  }
}