import { Hono } from 'hono';
import {
  AiProviderError,
  AiService,
  buildRecommendationAutofillMessages,
  buildSimilarNavRecommendationMessages,
  DEFAULT_RECOMMENDATION_AUTOFILL_PROMPT,
  DEFAULT_SIMILAR_NAV_RECOMMENDATIONS_PROMPT,
  normalizeSimilarNavRecommendationInput,
  parseRecommendationAutofillContent,
  parseSimilarNavRecommendations,
  prependSystemPrompt,
  RECOMMENDATION_AUTOFILL_PROMPT_CODE,
  SIMILAR_NAV_RECOMMENDATIONS_PROMPT_CODE,
} from 'doggy-nav-core';
import type {
  AiProviderFailure,
  AiProviderService,
  ChatMessage,
  PromptService,
} from 'doggy-nav-core';
import type { Env } from './index';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';
import { createAuthMiddleware } from '../middleware/auth';
import { loadSmtpSettings, sendSmtpEmail } from '../utils/smtp';

const aiRoutes = new Hono<{ Bindings: Env }>();

async function notifyAiProviderFailures(c: any, taskName: string, failures: AiProviderFailure[]) {
  try {
    const settings = await loadSmtpSettings(c.env.DB);
    if (!settings?.enabled) return;
    let recipients = settings.adminEmails;
    if (!recipients.length) {
      const result = await c.env.DB.prepare(
        `SELECT DISTINCT u.email FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.slug = 'sysadmin' AND u.is_active = 1`
      ).all();
      recipients = (result.results || []).map((row: any) => row.email).filter(Boolean);
    }
    if (!recipients.length) {
      console.error('[ai] exhausted provider alert has no recipients', { taskName });
      return;
    }
    const details = failures
      .map(
        ({ name, provider, status, message }) =>
          `- ${name} (${provider}): ${status ? `HTTP ${status} - ` : ''}${message}`
      )
      .join('\n');
    await sendSmtpEmail({
      ...settings,
      to: [...new Set(recipients)].slice(0, 50),
      subject: `[Doggy Nav] All AI providers failed: ${taskName}`,
      text: `All AI providers failed while running ${taskName}.\n\n${details}`,
    });
  } catch (error) {
    console.error('[ai] failed to send exhausted provider alert', error);
  }
}

async function runAiTask<T>(c: any, taskName: string, task: (ai: AiService) => Promise<T>) {
  const svc = getDI(c).resolve(TOKENS.AiProviderService) as AiProviderService;
  return svc.runWithFailover(
    (config) => task(new AiService(config)),
    (failures) => notifyAiProviderFailures(c, taskName, failures)
  );
}

function providerErrorResponse(c: any, e: AiProviderError) {
  console.warn('[ai] provider request failed', {
    provider: e.provider,
    status: e.status,
    request: e.request,
    responseBody: e.responseBody,
  });
  const includeDetails = c.env.NODE_ENV !== 'production';
  return c.json(
    {
      error: {
        message: e.message,
        provider: e.provider,
        status: e.status,
        ...(includeDetails && e.responseBody ? { providerResponse: e.responseBody } : {}),
      },
    },
    502
  );
}

aiRoutes.post('/api/ai/chat', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const body = await c.req.json();
    if (!body || !Array.isArray(body.messages)) {
      return c.json({ error: { message: 'messages is required' } }, 400);
    }
    // Low-level chat only applies a backend prompt when callers explicitly request a prompt code.
    let messages: ChatMessage[] = (body.messages as any[]).map((m) => ({
      role: m.role as any,
      content: String(m.content ?? ''),
    }));
    const promptCode = String(body.promptCode || '').trim();
    if (promptCode) {
      try {
        const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
        const active = await svc.getActiveByCode(promptCode);
        if (active?.content) messages = prependSystemPrompt(messages, active.content);
      } catch {}
    }
    const res = await runAiTask(c, 'chat', (ai) =>
      ai.chatCompletions({
        model: body.model,
        messages,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        max_completion_tokens: body.max_completion_tokens,
        top_p: body.top_p,
        stop: body.stop,
        frequency_penalty: body.frequency_penalty,
        presence_penalty: body.presence_penalty,
        response_format: body.response_format,
        thinking: body.thinking,
        extra_body: body.extra_body,
        stream: false,
      })
    );
    return c.json(res);
  } catch (e: any) {
    if (e instanceof AiProviderError) {
      return providerErrorResponse(c, e);
    }
    return c.json(
      { error: { message: e?.message || 'inference failed' } },
      e?.status === 503 ? 503 : 500
    );
  }
});

aiRoutes.post('/api/ai/tasks/recommendation-autofill', async (c) => {
  try {
    const body = await c.req.json();
    const url = String(body?.url || '').trim();
    if (!url) return c.json({ error: { message: 'url is required' } }, 400);

    let prompt = DEFAULT_RECOMMENDATION_AUTOFILL_PROMPT;
    try {
      const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
      const active = await svc.getActiveByCode(RECOMMENDATION_AUTOFILL_PROMPT_CODE);
      if (active?.content) prompt = active.content;
    } catch {}

    const res = await runAiTask(c, 'recommendation-autofill', (ai) =>
      ai.chatCompletions({
        messages: buildRecommendationAutofillMessages(
          {
            url,
          },
          prompt
        ),
        temperature: body.temperature,
        max_tokens: body.max_tokens || 2048,
        max_completion_tokens: body.max_completion_tokens,
        top_p: body.top_p,
        stream: false,
      })
    );
    const values = parseRecommendationAutofillContent(res?.choices?.[0]?.message?.content);
    if (!values) {
      return c.json({ error: { message: 'AI returned invalid recommendation JSON' } }, 502);
    }
    return c.json(values);
  } catch (e: any) {
    if (e instanceof AiProviderError) return providerErrorResponse(c, e);
    return c.json(
      { error: { message: e?.message || 'recommendation autofill failed' } },
      e?.status === 503 ? 503 : 500
    );
  }
});

aiRoutes.post('/api/ai/tasks/similar-nav', async (c) => {
  try {
    const body = await c.req.json();
    const input = normalizeSimilarNavRecommendationInput(body);
    if (!input) {
      return c.json({ error: { message: 'A valid source website is required' } }, 400);
    }
    const { source } = input;

    let prompt = DEFAULT_SIMILAR_NAV_RECOMMENDATIONS_PROMPT;
    try {
      const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
      const active = await svc.getActiveByCode(SIMILAR_NAV_RECOMMENDATIONS_PROMPT_CODE);
      if (active?.content) prompt = active.content;
    } catch {}

    const res = await runAiTask(c, 'similar-nav', (ai) =>
      ai.chatCompletions(
        {
          messages: buildSimilarNavRecommendationMessages(source, prompt),
          temperature: Math.min(1, Math.max(0, Number(body.temperature) || 0.35)),
          max_tokens: Math.min(2400, Math.max(256, Number(body.max_tokens) || 1800)),
          max_completion_tokens: body.max_completion_tokens
            ? Math.min(2400, Math.max(256, Number(body.max_completion_tokens) || 1800))
            : undefined,
          stream: false,
        },
        { timeoutMs: 120_000, maxRetries: 0 }
      )
    );
    const values = parseSimilarNavRecommendations(res?.choices?.[0]?.message?.content, source.url);
    if (!values) {
      return c.json({ error: { message: 'AI returned invalid recommendations' } }, 502);
    }
    return c.json(values);
  } catch (e: any) {
    if (e instanceof AiProviderError) return providerErrorResponse(c, e);
    return c.json(
      { error: { message: e?.message || 'similar recommendations failed' } },
      e?.status === 503 ? 503 : 500
    );
  }
});

export default aiRoutes;
