import { AiProviderError, AiProviderService, AiService, type ChatMessage } from 'doggy-nav-core';
import Controller from '../core/base_controller';
import { TOKENS } from '../core/ioc';
import { Inject } from '../core/inject';

export default class AiProviderController extends Controller {
  @Inject(TOKENS.AiProviderService)
  private aiProviderService!: AiProviderService;

  async list() {
    const query = this.getSanitizedQuery();
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(query.pageNumber) || 1, 1);
    const res = await this.aiProviderService.list({ pageSize, pageNumber });
    this.success(res);
  }

  async add() {
    try {
      const body = this.getSanitizedBody();
      const res = await this.aiProviderService.create({
        name: body?.name,
        provider: body?.provider,
        baseURL: body?.baseURL,
        model: body?.model,
        apiKey: body?.apiKey,
        active: body?.active,
      });
      this.success(res);
    } catch (error: any) {
      if (error?.name === 'ValidationError') return this.error(error.message);
      this.ctx.logger.error('Failed to create AI provider:', error);
      this.error('Failed to create AI provider');
    }
  }

  async update() {
    try {
      const body = this.getSanitizedBody();
      const id = String(body?.id || '');
      const res = await this.aiProviderService.update(id, {
        name: body?.name,
        provider: body?.provider,
        baseURL: body?.baseURL,
        model: body?.model,
        apiKey: body?.apiKey,
        active: body?.active,
      });
      if (!res) return this.error('AI provider not found');
      this.success(res);
    } catch (error: any) {
      if (error?.name === 'ValidationError') return this.error(error.message);
      this.ctx.logger.error('Failed to update AI provider:', error);
      this.error('Failed to update AI provider');
    }
  }

  async remove() {
    try {
      const body = this.getSanitizedBody();
      const id = String(body?.id || '');
      const ok = await this.aiProviderService.delete(id);
      if (!ok) return this.error('AI provider not found');
      this.success(true);
    } catch (error: any) {
      if (error?.name === 'ValidationError') return this.error(error.message);
      this.ctx.logger.error('Failed to delete AI provider:', error);
      this.error('Failed to delete AI provider');
    }
  }

  async setActive() {
    try {
      const id = String(this.ctx.params?.id || this.getSanitizedBody()?.id || '');
      const res = await this.aiProviderService.activate(id);
      if (!res) return this.error('AI provider not found');
      this.success(res);
    } catch (error: any) {
      if (error?.name === 'ValidationError') return this.error(error.message);
      this.ctx.logger.error('Failed to activate AI provider:', error);
      this.error('Failed to activate AI provider');
    }
  }

  async test() {
    try {
      const id = String(this.ctx.params?.id || '');
      const cfg = await this.aiProviderService.getConfigById(id);
      if (!cfg) return this.error('AI provider not found');
      const body = this.getSanitizedBody();
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
      });
      this.success(res);
    } catch (error: any) {
      if (error instanceof AiProviderError) {
        this.ctx.logger.warn('[ai-provider:test] provider request failed', {
          provider: error.provider,
          status: error.status,
          request: error.request,
          responseBody: error.responseBody,
        });
        return this.error(error.message);
      }
      this.ctx.logger.error('Failed to test AI provider:', error);
      this.error(error?.message || 'Failed to test AI provider');
    }
  }
}
