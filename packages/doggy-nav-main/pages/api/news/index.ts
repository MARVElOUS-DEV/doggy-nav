import type { NextApiRequest, NextApiResponse } from 'next';
import axios from '@/utils/axios';

type Item = {
  id: string;
  title: string;
  url: string | null;
  domain: string | null;
  points?: number;
  comments?: number;
  author?: string;
  createdAt?: string; // ISO
};

function extractDomain(u: string | null): string | null {
  if (!u) return null;
  try {
    const { hostname } = new URL(u);
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: 0, message: 'Method not allowed' });
  }
  try {
    // Use HN Algolia Front Page as a stable public source; can be swapped later via env.
    const source =
      process.env.NEWS_SOURCE_URL || 'https://hn.algolia.com/api/v1/search?tags=front_page';
    const { data } = await axios.get(source, {
      timeout: process.env.NODE_ENV === 'development' ? 0 : 12000,
    });
    const hits = Array.isArray(data?.hits) ? data.hits : [];
    const items: Item[] = hits.map((h: any) => {
      const url: string | null = h.url || null;
      return {
        id: String(h.objectID || h.objectId || h.id || h.title),
        title: h.title || h.story_title || 'Untitled',
        url,
        domain: extractDomain(url),
        points: typeof h.points === 'number' ? h.points : undefined,
        comments: typeof h.num_comments === 'number' ? h.num_comments : undefined,
        author: h.author || undefined,
        createdAt: h.created_at || undefined,
      } as Item;
    });
    return res.status(200).json({ items });
  } catch (e: any) {
    console.error('news api error:', e?.message || e);
    return res.status(500).json({ code: 0, message: 'Failed to load news' });
  }
}
