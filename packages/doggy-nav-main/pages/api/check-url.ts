import { NextApiRequest, NextApiResponse } from 'next';
import { probeUrlAvailability } from '../../lib/urlAvailability';
import { requestPublicHttpNode } from 'doggy-nav-core/dist/security/publicHttpNode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  const startTime = Date.now();

  try {
    const result = await probeUrlAvailability(url, {
      timeoutMs: 5000,
      fetchImpl: async (input, init) => {
        const response = await requestPublicHttpNode(String(input), {
          method: init?.method === 'GET' ? 'GET' : 'HEAD',
          headers: Object.fromEntries(new Headers(init?.headers).entries()),
          timeoutMs: 5000,
        });
        return new Response(null, { status: response.status });
      },
      init: {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        },
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(200).json({
      accessible: false,
      status: 0,
      responseTime: Date.now() - startTime,
      checkedVia: 'HEAD',
    });
  }
}
