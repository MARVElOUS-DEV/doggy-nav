import Controller from '../core/base_controller';
import { ValidationError } from '../core/errors';
import { TOKENS } from '../core/ioc';
import { Inject } from '../core/inject';
import type { SiteSettingsService } from 'doggy-nav-core';

export default class SiteSettingsController extends Controller {
  @Inject(TOKENS.SiteSettingsService)
  private siteSettingsService!: SiteSettingsService;

  async get() {
    try {
      const settings = await this.siteSettingsService.get();
      this.success(settings);
    } catch (error: any) {
      this.ctx.logger.error('Failed to get site settings:', error);
      this.error('Failed to get site settings');
    }
  }

  async getPublic() {
    return this.get();
  }

  async update() {
    try {
      const body = this.getSanitizedBody();
      const updated = await this.siteSettingsService.update(body);
      this.success(updated);
    } catch (error: any) {
      if (error instanceof ValidationError || error?.name === 'ValidationError') {
        this.error(error.message);
      } else {
        this.ctx.logger.error('Failed to update site settings:', error);
        this.error('Failed to update site settings');
      }
    }
  }
}
