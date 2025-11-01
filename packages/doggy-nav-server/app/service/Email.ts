import { Service } from 'egg';
import nodemailer from 'nodemailer';
import type { EmailNotificationSettings } from '../../types/email';

export default class EmailService extends Service {
  private transporter: nodemailer.Transporter | null = null;

  // Initialize email transporter
  private async initializeTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const settings = await this.getEffectiveSettings();
    if (!settings || !settings.smtpHost) {
      this.ctx.logger.warn('Email settings not configured, skipping email service initialization');
      return null;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass,
        },
      });

      // Verify connection
      await this.transporter.verify();
      this.ctx.logger.info('Email service initialized successfully');
      return this.transporter;
    } catch (error) {
      this.ctx.logger.error('Failed to initialize email service:', error);
      return null;
    }
  }

  // Get email notification settings from DB (may be null)
  async getSettings(): Promise<EmailNotificationSettings | null> {
    try {
      const settings = await this.ctx.model.EmailNotificationSettings.findOne();
      return settings;
    } catch (error) {
      this.ctx.logger.error('Failed to get email settings:', error);
      return null;
    }
  }

  // Merge DB settings with environment defaults (env wins only when DB is empty)
  private getEnvSettings(): Partial<EmailNotificationSettings> | null {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      EMAIL_FROM_NAME,
      EMAIL_FROM_ADDRESS,
      EMAIL_REPLY_TO,
    } = process.env as Record<string, string | undefined>;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM_ADDRESS) return null;
    return {
      smtpHost: SMTP_HOST,
      smtpPort: SMTP_PORT ? Number(SMTP_PORT) : 587,
      smtpSecure: SMTP_SECURE === 'true',
      smtpUser: SMTP_USER,
      smtpPass: SMTP_PASS,
      fromName: EMAIL_FROM_NAME || 'Doggy Nav',
      fromAddress: EMAIL_FROM_ADDRESS,
      replyTo: EMAIL_REPLY_TO || EMAIL_FROM_ADDRESS,
      enableNotifications: true,
      adminEmails: [],
    } as unknown as EmailNotificationSettings;
  }

  // Effective settings (DB if present, else ENV)
  private async getEffectiveSettings(): Promise<EmailNotificationSettings | null> {
    const db = await this.getSettings();
    if (db) return db as EmailNotificationSettings;
    const envCfg = this.getEnvSettings();
    return (envCfg || null) as EmailNotificationSettings | null;
  }

  // Update email notification settings
  async updateSettings(
    settingsData: Partial<EmailNotificationSettings>
  ): Promise<EmailNotificationSettings> {
    try {
      let settings = await this.ctx.model.EmailNotificationSettings.findOne();
      if (settings) {
        Object.assign(settings, settingsData);
      } else {
        settings = new this.ctx.model.EmailNotificationSettings(settingsData);
      }
      await settings.save();

      // Reinitialize transporter with new settings
      this.transporter = null;
      await this.initializeTransporter();

      return settings;
    } catch (error) {
      this.ctx.logger.error('Failed to update email settings:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      const transporter = await this.initializeTransporter();
      if (!transporter) {
        this.ctx.logger.warn('Email service not available, skipping email send');
        return false;
      }

      const settings = await this.getEffectiveSettings();
      if (!settings) {
        this.ctx.logger.warn('Email settings not found, skipping email send');
        return false;
      }

      if (settings.enableNotifications === false) {
        this.ctx.logger.info('Email notifications disabled, skipping email send');
        return false;
      }

      const mailOptions = {
        from: `"${settings.fromName}" <${settings.fromAddress}>`,
        to,
        subject,
        text,
        html,
        replyTo: settings.replyTo,
      };

      await transporter.sendMail(mailOptions);
      this.ctx.logger.info(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.ctx.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  // Send notification when nav item is submitted
  async sendSubmissionNotification(submitterEmail: string, navItemName: string): Promise<boolean> {
    const subject = '导航网站推荐已提交';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>导航网站推荐已提交</h2>
        <p>您好，</p>
        <p>您的导航网站推荐 "<strong>${navItemName}</strong>" 已成功提交，正在等待管理员审核。</p>
        <p>我们会在审核完成后通过邮件通知您结果。</p>
        <p>感谢您的贡献！</p>
        <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿直接回复。</p>
      </div>
    `;

    return this.sendEmail(submitterEmail, subject, html);
  }

  // Send notification when nav item is approved
  async sendApprovalNotification(submitterEmail: string, navItemName: string): Promise<boolean> {
    const subject = '导航网站推荐已通过审核';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>审核通过通知</h2>
        <p>您好，</p>
        <p>恭喜！您的导航网站推荐 "<strong>${navItemName}</strong>" 已通过审核。</p>
        <p>您的推荐已正式加入我们的导航网站，感谢您的贡献！</p>
        <p><a href="${process.env.WEB_URL || 'https://doggy-nav.vercel.app'}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">查看网站</a></p>
        <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿直接回复。</p>
      </div>
    `;

    return this.sendEmail(submitterEmail, subject, html);
  }

  // Send notification when nav item is rejected
  async sendRejectionNotification(
    submitterEmail: string,
    navItemName: string,
    reason?: string
  ): Promise<boolean> {
    const subject = '导航网站推荐未通过审核';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>审核结果通知</h2>
        <p>您好，</p>
        <p>很抱歉，您的导航网站推荐 "<strong>${navItemName}</strong>" 未通过审核。</p>
        ${reason ? `<p>拒绝原因：${reason}</p>` : ''}
        <p>感谢您的理解与支持，欢迎您再次提交其他优质网站推荐。</p>
        <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿直接回复。</p>
      </div>
    `;

    return this.sendEmail(submitterEmail, subject, html);
  }

  // Send notification to admins when new nav item is submitted
  async sendAdminNotification(
    adminEmails: string[],
    navItemName: string,
    submitterName?: string
  ): Promise<boolean[]> {
    const subject = '新的导航网站推荐待审核';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>新的网站推荐</h2>
        <p>有新的导航网站推荐需要审核：</p>
        <ul>
          <li><strong>网站名称：</strong> ${navItemName}</li>
          ${submitterName ? `<li><strong>提交者：</strong> ${submitterName}</li>` : ''}
        </ul>
        <p><a href="${process.env.ADMIN_URL}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">前往审核</a></p>
        <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿直接回复。</p>
      </div>
    `;

    let recipients = Array.isArray(adminEmails) ? adminEmails.filter(Boolean) : [];
    if (recipients.length === 0) {
      try {
        // Fallback: find users with sysadmin or admin roles
        const roles = await this.ctx.model.Role.find({
          slug: { $in: ['sysadmin', 'admin'] },
        }).select('_id');
        const roleIds = roles.map((r: any) => r._id);
        const users = await this.ctx.model.User.find({ roles: { $in: roleIds } }).select('email');
        recipients = users.map((u: any) => u.email).filter((e: any) => !!e);
      } catch (e) {
        this.ctx.logger.warn('Failed to resolve admin recipients from roles:', e);
      }
    }

    const results = await Promise.all(
      recipients.map((email) => this.sendEmail(email, subject, html))
    );

    return results;
  }

  // Test email configuration
  async testEmailConfiguration(): Promise<boolean> {
    try {
      const settings = await this.getEffectiveSettings();
      if (!settings) {
        throw new Error('Email settings not configured');
      }

      const testEmail = settings.fromAddress;
      const subject = '邮件配置测试';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>邮件配置测试</h2>
          <p>这是一封测试邮件，用于验证邮件配置是否正确。</p>
          <p>如果收到此邮件，说明邮件配置正常。</p>
          <p style="color: #666; font-size: 12px;">发送时间：${new Date().toLocaleString()}</p>
        </div>
      `;

      return this.sendEmail(testEmail, subject, html);
    } catch (error) {
      this.ctx.logger.error('Failed to send test email:', error);
      throw error;
    }
  }

  // Health check for email service
  async checkHealth(): Promise<{ ok: boolean; message?: string }> {
    try {
      const transporter = await this.initializeTransporter();
      if (!transporter) return { ok: false, message: 'Email transporter not initialized' };
      await transporter.verify();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: e?.message || 'verify failed' };
    }
  }
}
