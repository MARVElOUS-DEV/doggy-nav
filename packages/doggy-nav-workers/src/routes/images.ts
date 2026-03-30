import { Hono } from 'hono';
import type { Env } from './index';
import { responses } from '../utils/responses';
import { getAccessTokenFromCookies } from '../utils/cookieAuth';

const imageRoutes = new Hono<{ Bindings: Env }>();

imageRoutes.post('/upload', async (c) => {
  const token = getAccessTokenFromCookies(c as any);
  if (!token) {
    return c.json(responses.err('Authentication required'), 401);
  }

  const imageServiceUrl = String(c.env.IMAGE_SERVICE_URL || '').trim();
  if (!imageServiceUrl) {
    return c.json(responses.err('Image service not configured'), 503);
  }

  const formData = await c.req.formData();
  if (formData.getAll('files').length === 0) {
    return c.json(responses.badRequest('No files provided'), 400);
  }

  const headers = new Headers({
    Authorization: `Bearer ${token}`,
  });
  const imageHostname = c.req.header('X-Image-Hostname');
  if (imageHostname) {
    headers.set('X-Image-Hostname', imageHostname);
  }

  const upstreamUrl = `${imageServiceUrl.replace(/\/+$/, '')}/upload`;
  const upstreamResp = await fetch(upstreamUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  const contentType = upstreamResp.headers.get('content-type') || 'application/json';
  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    headers: {
      'content-type': contentType,
    },
  });
});

export default imageRoutes;
