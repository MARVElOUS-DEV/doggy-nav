import { Hono } from 'hono';
import { AiProviderError, AiProviderService, AiService, type ChatMessage } from 'doggy-nav-core';
import { responses } from '../utils/responses';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';
import { createAuthMiddleware, requireRole } from '../middleware/auth';

const aiProviderRoutes = new Hono<{ Bindings: { DB: D1Database; NODE_ENV?: string } }>();

aiProviderRoutes.get(
  '/',
  createAuthMiddleware({ required: true }),
  requireRole('sysadmin'),
  async (c) => {
    try {
      const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 200);
      const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
      const svc = getDI(c).resolve(TOKENS.AiProviderService) as AiProviderService;
      const res = await svc.list({ pageSize, pageNumber });
      return c.json(responses.ok(res));
    } catch (err) {
      console.error('AI provider list error:', err);
      return c.json(responses.serverError(), 500);
    }
  }
);

aiProviderRoutes.post(
  '/',
  createAuthMiddleware({ required: true }),
  requireRole('sysadmin'),
  async (c) => {
    try {
      const body = await c.req.json();
      const svc = getDI(c).resolve(TOKENS.AiProviderService) as AiProviderService;
      const provider = await svc.create({
        name: body?.name,
        provider: body?.provider,
        baseURL: body?.baseURL,
        model: body?.model,
        apiKey: body?.apiKey,
        active: body?.active,
      });
      return c.json(responses.ok(provider));
    } catch (err: any) {
      if (err?.name === 'ValidationError') return c.json(responses.badRequest(err.message), 400);
      console.error('AI provider create error:', err);
      return c.json(responses.serverError(), 500);
    }
  }
);

aiProviderRoutes.put(
  '/',
  createAuthMiddleware({ required: true }),
  requireRole('sysadmin'),
  async (c) => {
    try {
      const body = await c.req.json();
      const id = String(body?.id || '');
      const svc = getDI(c).resolve(TOKENS.AiProviderService) as AiProviderService;
      const provider = await svc.update(id, {
        name: body?.name,
        provider: body?.provider,
        baseURL: body?.baseURL,
        model: body?.model,
        apiKey: body?.apiKey,
        active: body?.active,
      });
      if (!provider) return c.json(responses.notFound('AI provider not found'), 404);
      return c.json(responses.ok(provider));
    } catch (err: any) {
      if (err?.name === 'ValidationError') return c.json(responses.badRequest(err.message), 400);
      console.error('AI provider update error:', err);
      return c.json(responses.serverError(), 500);
    }
  }
);

aiProviderRoutes.delete(
  '/',
  createAuthMiddleware({ required: true }),
  requireRole('sysadmin'),
  async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const id = String(body?.id || '');
      const svc = getDI(c).resolve(TOKENS.AiProviderService) as AiProviderService;
      const ok = await svc.delete(id);
      if (!ok) return c.json(responses.notFound('AI provider not found'), 404);
      return c.json(responses.ok(true));
    } catch (err: any) {
      if (err?.name === 'ValidationError') return c.json(responses.badRequest(err.message), 400);
      console.error('AI provider delete error:', err);
      return c.json(responses.serverError(), 500);
    }
  }
);

aiProviderRoutes.post(
  '/:id/activate',
  createAuthMiddleware({ required: true }),
  requireRole('sysadmin'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const svc = getDI(c).resolve(TOKENS.AiProviderService) as AiProviderService;
      const provider = await svc.activate(id);
      if (!provider) return c.json(responses.notFound('AI provider not found'), 404);
      return c.json(responses.ok(provider));
    } catch (err: any) {
      if (err?.name === 'ValidationError') return c.json(responses.badRequest(err.message), 400);
      console.error('AI provider activate error:', err);
      return c.json(responses.serverError(), 500);
    }
  }
);

aiProviderRoutes.post(
  '/:id/test',
  createAuthMiddleware({ required: true }),
  requireRole('sysadmin'),
  async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json().catch(() => ({}));
      const svc = getDI(c).resolve(TOKENS.AiProviderService) as AiProviderService;
      const cfg = await svc.getConfigById(id);
      if (!cfg) return c.json(responses.notFound('AI provider not found'), 404);
      const messages: ChatMessage[] = Array.isArray(body?.messages)
        ? body.messages
        : [{ role: 'user', content: 'Reply with ok.' }];
      const ai = new AiService(cfg);
      const res = await ai.chatCompletions({
        messages,
        model: body?.model,
        temperature: body?.temperature,
        max_tokens: body?.max_tokens || 64,
        max_completion_tokens: body?.max_completion_tokens,
        stream: false,
      });
      return c.json(responses.ok(res));
    } catch (err: any) {
      if (err instanceof AiProviderError) {
        console.warn('[ai-provider:test] provider request failed', {
          provider: err.provider,
          status: err.status,
          request: err.request,
          responseBody: err.responseBody,
        });
        return c.json(responses.err(err.message), 502);
      }
      console.error('AI provider test error:', err);
      return c.json(responses.serverError(err?.message || 'AI provider test failed'), 500);
    }
  }
);

export default aiProviderRoutes;
