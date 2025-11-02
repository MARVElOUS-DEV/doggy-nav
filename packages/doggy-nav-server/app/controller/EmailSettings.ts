import Controller from '../core/base_controller';
import { ValidationError } from '../core/errors';
import { EmailSettingsService } from 'doggy-nav-core';
import MongooseEmailSettingsRepository from '../../adapters/emailSettingsRepository';

export default class EmailSettingsController extends Controller {
  tableName(): string {
    return 'EmailNotificationSettings';
  }

  async get() {
    try {
      const repo = new MongooseEmailSettingsRepository(this.ctx);
      const service = new EmailSettingsService(repo);
      const settings = await service.get();
      this.success(settings);
    } catch (error: any) {
      this.ctx.logger.error('Failed to get email settings:', error);
      this.error('Failed to get email settings');
    }
  }

  async update() {
    try {
      const body = this.getSanitizedBody();
      const repo = new MongooseEmailSettingsRepository(this.ctx);
      const service = new EmailSettingsService(repo);
      const updated = await service.update(body);
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