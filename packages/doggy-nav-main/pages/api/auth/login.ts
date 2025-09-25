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
    const response = await axios.post(`${SERVER_URL}/api/login`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.status(response.status).json(response.data);

  } catch (error: any) {
    console.error('Login proxy error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({
      code: 0,
      message: 'Server connection failed',
      success: false
    });
  }
}