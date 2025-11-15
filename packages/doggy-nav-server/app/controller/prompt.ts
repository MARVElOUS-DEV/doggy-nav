import Controller from '../core/base_controller';
import { Inject } from '../core/inject';
import { TOKENS } from '../core/ioc';
import type { PromptService } from 'doggy-nav-core';

export default class PromptController extends Controller {
  @Inject(TOKENS.PromptService)
  private promptService!: PromptService;

  async list() {
    const query = this.getSanitizedQuery();
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(query.pageNumber) || 1, 1);
    const res = await this.promptService.list({ pageSize, pageNumber });
    this.success(res);
  }

  async setActive() {
    const body = this.getSanitizedBody();
    const id = body.id || this.ctx.params?.id;
    if (!id) return this.error('id is required');
    const res = await this.promptService.activate(id);
    if (!res) return this.error('prompt not found');
    this.success(res);
  }

  async add() {
    const body = this.getSanitizedBody();
    const name = String(body?.name || '').trim();
    const content = String(body?.content || '');
    const active = Boolean(body?.active);
    if (!name || !content) return this.error('name and content required');
    const res = await this.promptService.create(name, content, active);
    this.success(res);
  }

  async update() {
    const body = this.getSanitizedBody();
    const id = String(body?.id || '');
    if (!id) return this.error('id is required');
    const res = await this.promptService.update(id, {
      name: body?.name,
      content: body?.content,
      active: body?.active,
    });
    if (!res) return this.error('prompt not found');
    this.success(res);
  }

  async remove() {
    const body = this.getSanitizedBody();
    const id = String(body?.id || '');
    if (!id) return this.error('id is required');
    const ok = await this.promptService.delete(id);
    if (!ok) return this.error('prompt not found');
    this.success(true);
  }
}
