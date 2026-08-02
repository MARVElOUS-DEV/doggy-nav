type SmtpSocket = Pick<Socket, 'readable' | 'writable' | 'opened' | 'close' | 'startTls'>;
type SmtpConnector = (
  address: { hostname: string; port: number },
  options: { secureTransport: 'on' | 'starttls'; allowHalfOpen: boolean }
) => SmtpSocket;

export interface SmtpEmail {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
}

export interface StoredSmtpSettings extends Omit<SmtpEmail, 'to' | 'subject' | 'text'> {
  enabled: boolean;
  adminEmails: string[];
}

const encoder = new TextEncoder();

function base64(value: string) {
  let binary = '';
  for (const byte of encoder.encode(value)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function assertAddress(value: string) {
  if (!/^[^\s<>@]+@[^\s<>@]+$/.test(value) || /[\r\n]/.test(value)) {
    throw new Error(`Invalid email address: ${value}`);
  }
}

export async function loadSmtpSettings(db: D1Database): Promise<StoredSmtpSettings | null> {
  const row = (await db
    .prepare(
      `SELECT smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass,
              from_address, enable_notifications, admin_emails
       FROM email_settings WHERE id = 'default'`
    )
    .first()) as any;
  if (!row) return null;
  let adminEmails: string[] = [];
  try {
    adminEmails = JSON.parse(row.admin_emails || '[]').filter(Boolean);
  } catch {}
  return {
    host: String(row.smtp_host || ''),
    port: Number(row.smtp_port),
    secure: Boolean(row.smtp_secure),
    username: String(row.smtp_user || ''),
    password: String(row.smtp_pass || ''),
    from: String(row.from_address || ''),
    enabled: Boolean(row.enable_notifications),
    adminEmails,
  };
}

export function buildSmtpMessage(email: SmtpEmail) {
  assertAddress(email.from);
  email.to.forEach(assertAddress);
  if (/\r|\n/.test(email.subject)) throw new Error('Invalid email subject');
  const body = base64(email.text)
    .replace(/.{1,76}/g, '$&\r\n')
    .trimEnd();
  return [
    `Date: ${new Date().toUTCString()}`,
    `From: <${email.from}>`,
    `To: ${email.to.join(', ')}`,
    `Subject: ${email.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
  ].join('\r\n');
}

class SmtpClient {
  private reader;
  private writer;
  private buffer = '';
  private readonly decoder = new TextDecoder();

  constructor(private socket: SmtpSocket) {
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }

  async response(expected: number[]) {
    const lines: string[] = [];
    let code = 0;
    while (true) {
      const line = await this.line();
      const match = /^(\d{3})([ -])/.exec(line);
      if (!match) throw new Error(`Invalid SMTP response: ${line}`);
      code = Number(match[1]);
      lines.push(line);
      if (match[2] === ' ') break;
    }
    if (!expected.includes(code)) throw new Error(`SMTP ${code}: ${lines.join('\n')}`);
    return lines.join('\n');
  }

  async command(value: string, expected: number[]) {
    await this.writer.write(encoder.encode(`${value}\r\n`));
    return this.response(expected);
  }

  async data(value: string) {
    await this.writer.write(encoder.encode(`${value}\r\n.\r\n`));
    await this.response([250]);
  }

  async startTls(hostname: string) {
    this.reader.releaseLock();
    this.writer.releaseLock();
    this.socket = this.socket.startTls({ expectedServerHostname: hostname });
    await this.socket.opened;
    this.reader = this.socket.readable.getReader();
    this.writer = this.socket.writable.getWriter();
    this.buffer = '';
  }

  async close() {
    try {
      this.reader.releaseLock();
      this.writer.releaseLock();
    } catch {}
    await this.socket.close().catch(() => undefined);
  }

  private async line(): Promise<string> {
    while (!this.buffer.includes('\r\n')) {
      const { done, value } = await this.reader.read();
      if (done) throw new Error('SMTP connection closed unexpectedly');
      this.buffer += this.decoder.decode(value, { stream: true });
    }
    const end = this.buffer.indexOf('\r\n');
    const line = this.buffer.slice(0, end);
    this.buffer = this.buffer.slice(end + 2);
    return line;
  }
}

export async function sendSmtpEmail(email: SmtpEmail, connector?: SmtpConnector) {
  if (!email.host || /[\r\n]/.test(email.host)) throw new Error('Invalid SMTP host');
  if (!Number.isInteger(email.port) || email.port < 1 || email.port > 65535 || email.port === 25) {
    throw new Error('Invalid SMTP port; Cloudflare Workers supports SMTP on ports such as 465/587');
  }
  if (!email.username || !email.password) throw new Error('SMTP credentials are required');
  if (!email.to.length) throw new Error('At least one email recipient is required');

  const openSocket = connector || (await import('cloudflare:sockets')).connect;
  const client = new SmtpClient(
    openSocket(
      { hostname: email.host, port: email.port },
      { secureTransport: email.secure ? 'on' : 'starttls', allowHalfOpen: false }
    )
  );
  const timeout = setTimeout(() => void client.close(), 15_000);
  try {
    await client.response([220]);
    let capabilities = await client.command('EHLO doggy-nav', [250]);
    if (!email.secure) {
      if (!capabilities.toUpperCase().includes('STARTTLS')) {
        throw new Error('SMTP server does not support STARTTLS');
      }
      await client.command('STARTTLS', [220]);
      await client.startTls(email.host);
      capabilities = await client.command('EHLO doggy-nav', [250]);
    }

    const auth = capabilities.toUpperCase();
    if (auth.includes('LOGIN')) {
      await client.command('AUTH LOGIN', [334]);
      await client.command(base64(email.username), [334]);
      await client.command(base64(email.password), [235]);
    } else if (auth.includes('PLAIN')) {
      await client.command(`AUTH PLAIN ${base64(`\0${email.username}\0${email.password}`)}`, [235]);
    } else {
      throw new Error('SMTP server does not support AUTH LOGIN or AUTH PLAIN');
    }

    await client.command(`MAIL FROM:<${email.from}>`, [250]);
    for (const recipient of email.to) {
      await client.command(`RCPT TO:<${recipient}>`, [250, 251]);
    }
    await client.command('DATA', [354]);
    await client.data(buildSmtpMessage(email));
    await client.command('QUIT', [221]);
  } finally {
    clearTimeout(timeout);
    await client.close();
  }
}
