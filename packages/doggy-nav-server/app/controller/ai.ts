import {
  AiService,
  createAiConfigFromEnv,
  prependSystemPrompt,
  ChatCompletionRequest,
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

    // Load active prompt if any and prepend as system
    let activePrompt: string | undefined;
    try {
      const doc: any = await this.ctx.model.Prompt.findOne({ active: true }).lean();
      activePrompt = doc?.content as any;
    } catch (_e) {
      this.logger.warn('Failed to load active prompt', _e);
      // ignore if collection not present
    }

    const messages = prependSystemPrompt(body.messages, activePrompt);
    const cfg = createAiConfigFromEnv(process.env);
    const ai = new AiService(cfg);
    const res = await ai.chatCompletions({
      model: body.model,
      messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      stream: false,
    });
    this.ctx.body = res;
  }
}
