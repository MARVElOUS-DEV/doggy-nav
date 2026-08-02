jest.mock('cloudflare:sockets', () => ({ connect: jest.fn() }), { virtual: true });

import { buildSmtpMessage, sendSmtpEmail } from '../utils/smtp';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function fakeSocket(responses: string, upgraded?: any) {
  const writes: string[] = [];
  return {
    writes,
    readable: new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(responses));
        controller.close();
      },
    }),
    writable: new WritableStream({
      write(chunk) {
        writes.push(decoder.decode(chunk));
      },
    }),
    opened: Promise.resolve({}),
    close: async () => undefined,
    startTls: () => upgraded,
  };
}

test('sends an alert through configured STARTTLS SMTP', async () => {
  const secure = fakeSocket(
    '250-mail.example\r\n250 AUTH LOGIN\r\n334 username\r\n334 password\r\n235 ok\r\n250 sender\r\n250 recipient\r\n354 data\r\n250 queued\r\n221 bye\r\n'
  );
  const initial = fakeSocket(
    '220 ready\r\n250-mail.example\r\n250-STARTTLS\r\n250 AUTH LOGIN\r\n220 go ahead\r\n',
    secure
  );

  await sendSmtpEmail(
    {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      username: 'user',
      password: 'pass',
      from: 'alerts@example.com',
      to: ['admin@example.com'],
      subject: 'Provider failure',
      text: 'All providers failed.',
    },
    () => initial as any
  );

  expect(initial.writes).toEqual(['EHLO doggy-nav\r\n', 'STARTTLS\r\n']);
  expect(secure.writes.join('')).toContain('AUTH LOGIN\r\ndXNlcg==\r\ncGFzcw==\r\n');
  expect(secure.writes.join('')).toContain('RCPT TO:<admin@example.com>\r\n');
  expect(secure.writes.join('')).toContain('Content-Transfer-Encoding: base64');
  expect(secure.writes.at(-1)).toBe('QUIT\r\n');
});

test('rejects header injection', () => {
  expect(() =>
    buildSmtpMessage({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      username: 'user',
      password: 'pass',
      from: 'alerts@example.com',
      to: ['admin@example.com'],
      subject: 'Alert\r\nBcc: attacker@example.com',
      text: 'failed',
    })
  ).toThrow('Invalid email subject');
});
