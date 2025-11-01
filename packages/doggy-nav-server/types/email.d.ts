import { Document } from 'mongoose';

export interface EmailNotificationSettings extends Document {
  // SMTP Configuration
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;

  // Sender Configuration
  fromName: string;
  fromAddress: string;
  replyTo: string;

  // Notification Settings
  enableNotifications: boolean;
  adminEmails: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailServiceInterface {
  getSettings(): Promise<EmailNotificationSettings | null>;
  updateSettings(settingsData: Partial<EmailNotificationSettings>): Promise<EmailNotificationSettings>;
  sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean>;
  sendSubmissionNotification(submitterEmail: string, navItemName: string): Promise<boolean>;
  sendApprovalNotification(submitterEmail: string, navItemName: string): Promise<boolean>;
  sendRejectionNotification(submitterEmail: string, navItemName: string, reason?: string): Promise<boolean>;
  sendAdminNotification(adminEmails: string[], navItemName: string, submitterName?: string): Promise<boolean[]>;
  testEmailConfiguration(): Promise<boolean>;
}