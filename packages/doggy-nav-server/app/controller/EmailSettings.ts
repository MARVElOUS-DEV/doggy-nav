import Controller from '../core/base_controller';
import { ValidationError } from '../core/errors';
import { TOKENS } from '../core/ioc';
import { Inject } from '../core/inject';
import type { EmailSettingsService } from 'doggy-nav-core';

export default class EmailSettingsController extends Controller {
  @Inject(TOKENS.EmailSettingsService)
  private emailSettingsService!: EmailSettingsService;

  tableName(): string {
    return 'EmailNotificationSettings';
  }

  async get() {
    try {
      const settings = await this.emailSettingsService.get();
      this.success(settings);
    } catch (error: any) {
      this.ctx.logger.error('Failed to get email settings:', error);
      this.error('Failed to get email settings');
    }
  }

  async update() {
    try {
      const body = this.getSanitizedBody();
      const updated = await this.emailSettingsService.update(body);
      this.success(updated);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        this.error(error.message);
      } else {
        this.ctx.logger.error('Failed to update email settings:', error);
        this.error('Failed to update email settings');
      }
    }
  }

  async test() {
    try {
      const success = await this.ctx.service.email.testEmailConfiguration();
      if (success) {
        this.success({ message: 'Test email sent successfully' });
      } else {
        this.error('Failed to send test email');
      }
    } catch (error: any) {
      this.ctx.logger.error('Test email failed:', error);
      this.error('Test email failed: ' + error.message);
    }
  }

  async health() {
    const res = await this.ctx.service.email.checkHealth();
    if (res.ok) return this.success({ status: 'ok' });
    this.error(res.message || 'Email service not ready');
  }
}