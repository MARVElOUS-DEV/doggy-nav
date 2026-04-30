import {
  AiProviderError,
  AiService,
  buildRecommendationAutofillMessages,
  createAiConfigFromEnv,
  DEFAULT_RECOMMENDATION_AUTOFILL_PROMPT,
  parseRecommendationAutofillContent,
  prependSystemPrompt,
  ChatCompletionRequest,
  RECOMMENDATION_AUTOFILL_PROMPT_CODE,
} from 'doggy-nav-core';
import { Controller } from 'egg';

export default class AiController extends Controller {
  async chatCompletions() {
    const body = this.ctx.request.body as ChatCompletionRequest;
    if (!body || !Array.isArray(body.messages)) {
      this.ctx.status = 400;
      this.ctx.body = { error: { message: 'messages is required' } };
      return;
    }

    // Low-level chat only applies a backend prompt when callers explicitly request a prompt code.
    let activePrompt: string | undefined;
    const promptCode = String((body as any).promptCode || '').trim();
    if (promptCode) {
      try {
        const doc: any = await this.ctx.model.Prompt.findOne({
          code: promptCode,
          active: true,
        }).lean();
        activePrompt = doc?.content as any;
      } catch (_e) {
        this.logger.warn('Failed to load active prompt', _e);
        // ignore if collection not present
      }
    }

    const messages = prependSystemPrompt(body.messages, activePrompt);
    const cfg = createAiConfigFromEnv(process.env);
    const ai = new AiService(cfg);
    try {
      const res = await ai.chatCompletions({
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
      });
      this.ctx.body = res;
    } catch (e) {
      if (e instanceof AiProviderError) {
        this.logger.warn('[ai] provider request failed', {
          provider: e.provider,
          status: e.status,
          request: e.request,
          responseBody: e.responseBody,
        });
        const includeDetails = process.env.NODE_ENV !== 'production';
        this.ctx.status = 502;
        this.ctx.body = {
          error: {
            message: e.message,
            provider: e.provider,
            status: e.status,
            ...(includeDetails && e.responseBody ? { providerResponse: e.responseBody } : {}),
          },
        };
        return;
      }
      throw e;
    }
  }

  async recommendationAutofill() {
    const body = this.ctx.request.body as any;
    const url = String(body?.url || '').trim();
    if (!url) {
      this.ctx.status = 400;
      this.ctx.body = { error: { message: 'url is required' } };
      return;
    }

    let prompt = DEFAULT_RECOMMENDATION_AUTOFILL_PROMPT;
    try {
      const doc: any = await this.ctx.model.Prompt.findOne({
        code: RECOMMENDATION_AUTOFILL_PROMPT_CODE,
        active: true,
      }).lean();
      if (doc?.content) prompt = doc.content;
    } catch (_e) {
      this.logger.warn('Failed to load recommendation prompt', _e);
    }

    const cfg = createAiConfigFromEnv(process.env);
    const ai = new AiService(cfg);
    try {
      const res = await ai.chatCompletions({
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
      });
      const content = res?.choices?.[0]?.message?.content;
      const values = parseRecommendationAutofillContent(content);
      if (!values) {
        this.ctx.status = 502;
        this.ctx.body = { error: { message: 'AI returned invalid recommendation JSON' } };
        return;
      }
      this.ctx.body = values;
    } catch (e) {
      if (e instanceof AiProviderError) {
        this.logger.warn('[ai:recommendation-autofill] provider request failed', {
          provider: e.provider,
          status: e.status,
          request: e.request,
          responseBody: e.responseBody,
        });
        const includeDetails = process.env.NODE_ENV !== 'production';
        this.ctx.status = 502;
        this.ctx.body = {
          error: {
            message: e.message,
            provider: e.provider,
            status: e.status,
            ...(includeDetails && e.responseBody ? { providerResponse: e.responseBody } : {}),
          },
        };
        return;
      }
      throw e;
    }
  }
}
