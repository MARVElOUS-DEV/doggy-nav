import assert from 'assert';
import { app } from 'egg-mock/bootstrap';
import EmailService from '../../../app/service/Email';

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    const ctx = app.mockContext();
    emailService = ctx.service.email as unknown as EmailService;
  });

  describe('sendEmail', () => {
    it('should return false when email service is not configured', async () => {
      const result = await emailService.sendEmail('test@example.com', 'Test', 'Test content');
      assert.strictEqual(result, false);
    });
  });

  describe('getSettings', () => {
    it('should return null when no settings exist', async () => {
      const settings = await emailService.getSettings();
      assert.strictEqual(settings, null);
    });
  });

  describe('updateSettings', () => {
    it('should create new settings', async () => {
      const settingsData = {
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'test@example.com',
        smtpPass: 'password',
        fromName: 'Test',
        fromAddress: 'test@example.com',
        replyTo: 'reply@example.com',
      };

      const settings = await emailService.updateSettings(settingsData);
      assert(settings);
      assert.strictEqual(settings.smtpHost, 'smtp.example.com');
      assert.strictEqual(settings.fromName, 'Test');
    });
  });
});
