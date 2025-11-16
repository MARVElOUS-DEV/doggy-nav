import Controller from '../core/base_controller';
import { Inject } from '../core/inject';
import { TOKENS } from '../core/ioc';
import type { AfficheService } from 'doggy-nav-core';

export default class AfficheController extends Controller {
  @Inject(TOKENS.AfficheService)
  private afficheService!: AfficheService;

  async list() {
    const query = this.getSanitizedQuery();
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(query.pageNumber) || 1, 1);
    const activeRaw = query.active;
    let active: boolean | undefined;
    if (activeRaw !== undefined && activeRaw !== '') {
      const v = String(activeRaw).toLowerCase();
      active = v === '1' || v === 'true';
    }
    const res = await this.afficheService.list({ pageSize, pageNumber }, { active });
    this.success(res);
  }

  async listActive() {
    const res = await this.afficheService.listActive();
    this.success(res);
  }

  async add() {
    const body = this.getSanitizedBody();
    const text = String(body?.text || '').trim();
    if (!text) return this.error('text is required');

    const payload: {
      text: string;
      linkHref?: string | null;
      linkText?: string | null;
      linkTarget?: string | null;
      active?: boolean;
      order?: number | null;
    } = { text };

    if (body.linkHref !== undefined) {
      const v = String(body.linkHref || '').trim();
      payload.linkHref = v || null;
    }
    if (body.linkText !== undefined) {
      const v = String(body.linkText || '').trim();
      payload.linkText = v || null;
    }
    if (body.linkTarget !== undefined) {
      const v = String(body.linkTarget || '').trim();
      payload.linkTarget = v || null;
    }
    if (body.active !== undefined) {
      payload.active = !!body.active;
    }
    if (body.order !== undefined) {
      payload.order = Number(body.order);
    }

    const res = await this.afficheService.create(payload);
    this.success(res);
  }

  async update() {
    const body = this.getSanitizedBody();
    const id = String(body?.id || '').trim();
    if (!id) return this.error('id is required');

    const patch: {
      text?: string;
      linkHref?: string | null;
      linkText?: string | null;
      linkTarget?: string | null;
      active?: boolean;
      order?: number | null;
    } = {};

    if (body.text !== undefined) {
      const t = String(body.text).trim();
      if (!t) return this.error('text cannot be empty');
      patch.text = t;
    }
    if (body.linkHref !== undefined) {
      const v = String(body.linkHref || '').trim();
      patch.linkHref = v || null;
    }
    if (body.linkText !== undefined) {
      const v = String(body.linkText || '').trim();
      patch.linkText = v || null;
    }
    if (body.linkTarget !== undefined) {
      const v = String(body.linkTarget || '').trim();
      patch.linkTarget = v || null;
    }
    if (body.active !== undefined) {
      patch.active = !!body.active;
    }
    if (body.order !== undefined) {
      patch.order = Number(body.order);
    }

    const res = await this.afficheService.update(id, patch);
    if (!res) return this.error('affiche not found');
    this.success(res);
  }

  async remove() {
    const body = this.getSanitizedBody();
    const id = String(body?.id || '').trim();
    if (!id) return this.error('id is required');
    const ok = await this.afficheService.delete(id);
    if (!ok) return this.error('affiche not found');
    this.success(true);
  }
}
