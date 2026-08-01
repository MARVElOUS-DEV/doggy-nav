import { Hono } from 'hono';
import {
  isHttpsLikeRequest,
  parsePublishedToolOutputToken,
  TOOL_OUTPUT_PUBLICATION_TOKEN_QUERY_PARAM,
  type ToolOutputPublicationService,
} from 'doggy-nav-core';
import { createAuthMiddleware } from '../middleware/auth';
import { getDI, getUser } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';
import { responses } from '../utils/responses';

type Env = {
  DB: D1Database;
  JWT_SECRET?: string;
  NODE_ENV?: string;
  TOOL_OUTPUT_REQUIRE_HTTPS?: string;
};

const toolOutputRoutes = new Hono<{ Bindings: Env }>();

toolOutputRoutes.get('/converter', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const svc = getDI(c).resolve(
      TOKENS.ToolOutputPublicationService
    ) as ToolOutputPublicationService;
    const value = await svc.listForUser(String(user.id));
    return c.json(responses.ok(value));
  } catch (err) {
    console.error('Tool output publication read error:', err);
    return c.json(responses.serverError(), 500);
  }
});

toolOutputRoutes.put('/converter', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const body = await c.req.json();
    const svc = getDI(c).resolve(
      TOKENS.ToolOutputPublicationService
    ) as ToolOutputPublicationService;
    const saved = await svc.saveForUser(String(user.id), {
      publishId: body?.publishId,
      enabled: !!body?.enabled,
      direction: body?.direction,
      contentType: String(body?.contentType || ''),
      output: String(body?.output || ''),
    });
    return c.json(responses.ok(saved));
  } catch (err: any) {
    return c.json(responses.badRequest(err?.message || 'Save publication failed'), 400);
  }
});

toolOutputRoutes.post(
  '/converter/rotate-token',
  createAuthMiddleware({ required: true }),
  async (c) => {
    try {
      const user = getUser(c)!;
      const body = await c.req.json();
      const svc = getDI(c).resolve(
        TOKENS.ToolOutputPublicationService
      ) as ToolOutputPublicationService;
      const result = await svc.rotateTokenForUser(String(user.id), String(body?.publishId || ''));
      return c.json(responses.ok(result));
    } catch (err: any) {
      return c.json(responses.notFound(err?.message || 'Published output does not exist'), 404);
    }
  }
);

toolOutputRoutes.delete('/converter', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const svc = getDI(c).resolve(
      TOKENS.ToolOutputPublicationService
    ) as ToolOutputPublicationService;
    const result = await svc.deleteForUser(String(user.id), String(c.req.query('publishId') || ''));
    return c.json(responses.ok(result));
  } catch (err) {
    console.error('Tool output publication delete error:', err);
    return c.json(responses.serverError(), 500);
  }
});

toolOutputRoutes.get('/converter/published/:publishId', async (c) => {
  const requireHttps = c.env.TOOL_OUTPUT_REQUIRE_HTTPS !== 'false';
  if (
    requireHttps &&
    c.env.NODE_ENV === 'production' &&
    !isHttpsLikeRequest({
      forwardedProto: c.req.header('x-forwarded-proto'),
      url: c.req.url,
    })
  ) {
    return new Response('HTTPS is required', { status: 400 });
  }

  const token = parsePublishedToolOutputToken(
    c.req.query(TOOL_OUTPUT_PUBLICATION_TOKEN_QUERY_PARAM)
  );
  if (!token) {
    return new Response('Subscription token required', { status: 401 });
  }

  try {
    const svc = getDI(c).resolve(
      TOKENS.ToolOutputPublicationService
    ) as ToolOutputPublicationService;
    const result = await svc.readPublished(c.req.param('publishId'), token);

    if (result.kind === 'not_found') {
      return new Response('Not Found', { status: 404 });
    }
    if (result.kind === 'unauthorized') {
      return new Response('Invalid subscription token', { status: 401 });
    }

    return new Response(result.data.output, {
      status: 200,
      headers: {
        'Content-Type': result.data.contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Published tool output read error:', err);
    return new Response('Internal server error', { status: 500 });
  }
});

export default toolOutputRoutes;
