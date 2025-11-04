import { Hono } from 'hono';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole } from '../middleware/auth';

export const emailSettingsRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

emailSettingsRoutes.get('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  const row = await c.env.DB.prepare(`SELECT * FROM email_settings WHERE id = 'default'`).first<any>();
  if (!row) return c.json(responses.ok(null));
  return c.json(responses.ok({
    smtpHost: row.smtp_host,
    smtpPort: Number(row.smtp_port),
    smtpSecure: !!row.smtp_secure,
    smtpUser: row.smtp_user,
    fromName: row.from_name,
    fromAddress: row.from_address,
    replyTo: row.reply_to,
    enableNotifications: !!row.enable_notifications,
    adminEmails: JSON.parse(row.admin_emails || '[]'),
    createdAt: row.created_at, updatedAt: row.updated_at,
  }));
});

emailSettingsRoutes.put('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  const b = await c.req.json();
  const required = ['smtpHost','smtpUser','fromAddress','smtpPass'];
  for (const k of required) {
    if (!b[k]) return c.json(responses.badRequest(`Missing required field: ${k}`), 400);
  }
  const smtpPort = Number(b.smtpPort || 587);
  const smtpSecure = b.smtpSecure ? 1 : 0;
  const enable = b.enableNotifications ? 1 : 0;
  const adminEmails = JSON.stringify(Array.isArray(b.adminEmails) ? b.adminEmails : []);
  const exists = await c.env.DB.prepare(`SELECT id FROM email_settings WHERE id = 'default'`).first<any>();
  if (exists) {
    await c.env.DB.prepare(`UPDATE email_settings SET smtp_host=?, smtp_port=?, smtp_secure=?, smtp_user=?, smtp_pass=?, from_name=?, from_address=?, reply_to=?, enable_notifications=?, admin_emails=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id='default'`)
      .bind(b.smtpHost, smtpPort, smtpSecure, b.smtpUser, b.smtpPass, b.fromName || 'Doggy Nav', b.fromAddress, b.replyTo || b.fromAddress, enable, adminEmails)
      .run();
  } else {
    await c.env.DB.prepare(`INSERT INTO email_settings (id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_name, from_address, reply_to, enable_notifications, admin_emails) VALUES ('default',?,?,?,?,?,?,?,?,?,?)`)
      .bind(b.smtpHost, smtpPort, smtpSecure, b.smtpUser, b.smtpPass, b.fromName || 'Doggy Nav', b.fromAddress, b.replyTo || b.fromAddress, enable, adminEmails)
      .run();
  }
  return c.json(responses.ok({ updated: true }));
});

emailSettingsRoutes.post('/test', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  // Basic validation-only test (Workers runtime cannot send SMTP directly without external service)
  const row = await c.env.DB.prepare(`SELECT * FROM email_settings WHERE id = 'default'`).first<any>();
  if (!row) return c.json(responses.badRequest('Email settings not configured'), 400);
  return c.json(responses.ok({ message: 'Config validated' }));
});

emailSettingsRoutes.get('/health', async (c) => {
  const row = await c.env.DB.prepare(`SELECT id FROM email_settings WHERE id = 'default'`).first<any>();
  return c.json(responses.ok({ status: row ? 'ok' : 'missing' }));
});

export default emailSettingsRoutes;
