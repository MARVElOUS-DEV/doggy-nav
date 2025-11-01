import Controller from '../core/base_controller';
import { ValidationError } from '../core/errors';

export default class EmailSettingsController extends Controller {
  tableName(): string {
    return 'EmailNotificationSettings';
  }

  async get() {
    try {
      const settings = await this.ctx.service.email.getSettings();
      if (settings) {
        const obj = settings.toObject();
        delete (obj as any).smtpPass;
        this.success(obj);
      } else {
        this.success(null);
      }
    } catch (error: any) {
      this.ctx.logger.error('Failed to get email settings:', error);
      this.error('Failed to get email settings');
    }
  }

  async update() {
    try {
      const body = this.getSanitizedBody();

      // Validate required fields
      if (!body.smtpHost || !body.smtpUser || !body.fromAddress) {
        throw new ValidationError('Missing required fields: smtpHost, smtpUser, fromAddress');
      }

      // Update with sensitive data included
      const settings = await this.ctx.service.email.updateSettings(body);
      const obj = (settings?.toObject?.() || settings || {}) as any;
      delete obj.smtpPass;
      this.success(obj);
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