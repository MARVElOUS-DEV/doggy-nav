import { Hono } from 'hono';
import {
  buildBasicAuthChallengeHeader,
  isHttpsLikeRequest,
  parseBasicAuthHeader,
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
    const svc = getDI(c).resolve(TOKENS.ToolOutputPublicationService) as ToolOutputPublicationService;
    const value = await svc.getForUser(String(user.id));
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
    const svc = getDI(c).resolve(TOKENS.ToolOutputPublicationService) as ToolOutputPublicationService;
    const saved = await svc.saveForUser(String(user.id), {
      enabled: !!body?.enabled,
      direction: body?.direction,
      contentType: String(body?.contentType || ''),
      output: String(body?.output || ''),
      basicAuthUsername: String(body?.basicAuthUsername || ''),
      basicAuthPassword:
        body?.basicAuthPassword !== undefined ? String(body.basicAuthPassword || '') : undefined,
    });
    return c.json(responses.ok(saved));
  } catch (err: any) {
    return c.json(responses.badRequest(err?.message || 'Save publication failed'), 400);
  }
});

toolOutputRoutes.delete('/converter', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const svc = getDI(c).resolve(TOKENS.ToolOutputPublicationService) as ToolOutputPublicationService;
    const result = await svc.deleteForUser(String(user.id));
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

  const auth = parseBasicAuthHeader(c.req.header('Authorization'));
  if (!auth) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': buildBasicAuthChallengeHeader(),
      },
    });
  }

  try {
    const svc = getDI(c).resolve(TOKENS.ToolOutputPublicationService) as ToolOutputPublicationService;
    const result = await svc.readPublished(c.req.param('publishId'), auth.username, auth.password);

    if (result.kind === 'not_found') {
      return new Response('Not Found', { status: 404 });
    }
    if (result.kind === 'unauthorized') {
      return new Response('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': buildBasicAuthChallengeHeader(),
        },
      });
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
