import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { SignJWT, jwtVerify } from 'jose';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
  type WebAuthnCredential,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { createAuthMiddleware } from '../middleware/auth';
import { D1UserRepository } from '../adapters/d1UserRepository';
import { getUser } from '../ioc/helpers';
import { clearAuthCookies, setAuthCookies } from '../utils/cookieAuth';
import { newId24 } from '../utils/id';
import { JWTUtils } from '../utils/jwtUtils';
import { responses } from '../utils/responses';
import { getUserAccessContext } from '../utils/userContext';

type PasskeyEnv = {
  DB: D1Database;
  JWT_SECRET?: string;
  NODE_ENV?: string;
  PASSKEY_ORIGIN?: string;
  PASSKEY_RP_ID?: string;
  PUBLIC_BASE_URL?: string;
};

type PasskeyRow = {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string;
};

const CHALLENGE_AUDIENCE = 'doggy-nav-passkey';
const passkeyRoutes = new Hono<{ Bindings: PasskeyEnv }>();

function getPasskeyConfig(c: any) {
  const forwardedHost = c.req.header('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = c.req.header('x-forwarded-proto')?.split(',')[0]?.trim();
  const requestUrl = new URL(c.req.url);
  const configuredOrigin = String(c.env.PASSKEY_ORIGIN || c.env.PUBLIC_BASE_URL || '').trim();
  const origin = configuredOrigin
    ? new URL(configuredOrigin).origin
    : `${forwardedProto || requestUrl.protocol.slice(0, -1)}://${forwardedHost || requestUrl.host}`;

  return {
    origin,
    rpID: String(c.env.PASSKEY_RP_ID || new URL(origin).hostname).trim(),
  };
}

function challengeCookieName(kind: 'login' | 'registration') {
  return `passkey_${kind}_challenge`;
}

async function setChallenge(
  c: any,
  kind: 'login' | 'registration',
  challenge: string,
  userId?: string
) {
  if (!c.env.JWT_SECRET) throw new Error('Missing JWT secret');
  const token = await new SignJWT({ challenge, kind, userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(CHALLENGE_AUDIENCE)
    .setExpirationTime('5m')
    .sign(new TextEncoder().encode(c.env.JWT_SECRET));
  const { origin } = getPasskeyConfig(c);
  setCookie(c, challengeCookieName(kind), token, {
    httpOnly: true,
    secure: origin.startsWith('https://'),
    sameSite: 'Strict',
    path: '/api',
    maxAge: 300,
  });
}

async function consumeChallenge(
  c: any,
  kind: 'login' | 'registration',
  userId?: string
): Promise<string> {
  const name = challengeCookieName(kind);
  const token = getCookie(c, name);
  const { origin } = getPasskeyConfig(c);
  deleteCookie(c, name, {
    secure: origin.startsWith('https://'),
    sameSite: 'Strict',
    path: '/api',
  });
  if (!token || !c.env.JWT_SECRET) throw new Error('Passkey challenge expired');

  const { payload } = await jwtVerify(token, new TextEncoder().encode(c.env.JWT_SECRET), {
    algorithms: ['HS256'],
    audience: CHALLENGE_AUDIENCE,
  });
  if (
    payload.kind !== kind ||
    typeof payload.challenge !== 'string' ||
    (userId && payload.userId !== userId)
  ) {
    throw new Error('Invalid passkey challenge');
  }
  return payload.challenge;
}

passkeyRoutes.post('/auth/passkey', async (c) => {
  if (!c.env.JWT_SECRET) {
    return c.json(responses.serverError('Missing JWT secret'), 503);
  }

  const body = await c.req.json().catch(() => ({}));
  const response = body.credential as AuthenticationResponseJSON | undefined;
  const { origin, rpID } = getPasskeyConfig(c);

  if (!response) {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
    });
    await setChallenge(c, 'login', options.challenge);
    return c.json(responses.ok(options));
  }

  try {
    if (!response.id) throw new Error('Missing credential ID');
    const row = await c.env.DB.prepare(
      `SELECT p.id, p.user_id, p.credential_id, p.public_key, p.counter, p.transports
       FROM passkeys p
       JOIN users u ON u.id = p.user_id
       WHERE p.credential_id = ? AND u.is_active = 1
       LIMIT 1`
    )
      .bind(response.id)
      .first<PasskeyRow>();
    if (!row) throw new Error('Unknown passkey');

    const credential: WebAuthnCredential = {
      id: row.credential_id,
      publicKey: isoBase64URL.toBuffer(row.public_key),
      counter: Number(row.counter),
      transports: JSON.parse(row.transports || '[]'),
    };
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: await consumeChallenge(c, 'login'),
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential,
      requireUserVerification: true,
    });
    if (!verification.verified) throw new Error('Unverified authentication');

    const updated = await c.env.DB.prepare(
      `UPDATE passkeys
       SET counter = ?, last_used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND counter = ?`
    )
      .bind(verification.authenticationInfo.newCounter, row.id, row.counter)
      .run();
    if (!updated.meta.changes) throw new Error('Passkey was already used');

    const userRepository = new D1UserRepository(c.env.DB);
    const access = await getUserAccessContext(c.env.DB, userRepository, row.user_id);
    if (!access) throw new Error('User not found or inactive');
    const user = {
      id: access.user.id,
      username: access.user.username,
      email: access.user.email,
      avatar: access.user.avatar,
      roles: access.roles,
      roleIds: access.roleIds,
      groups: access.groups,
      groupIds: access.groupIds,
      permissions: access.permissions,
    };
    const tokens = await new JWTUtils(c.env.JWT_SECRET).generateTokenPair(
      JWTUtils.createPayload(user)
    );
    await userRepository.update(user.id, { lastLoginAt: new Date() });
    clearAuthCookies(c);
    setAuthCookies(c, tokens);
    return c.json(responses.ok({ user }));
  } catch (error) {
    console.warn('Passkey login failed', error);
    return c.json(responses.err('Passkey login failed'), 401);
  }
});

passkeyRoutes.get('/user/passkeys', createAuthMiddleware({ required: true }), async (c) => {
  const user = getUser(c)!;
  const result = await c.env.DB.prepare(
    `SELECT id, name, created_at, last_used_at
     FROM passkeys WHERE user_id = ? ORDER BY created_at DESC`
  )
    .bind(user.id)
    .all<{ id: string; name: string; created_at: string; last_used_at: string | null }>();
  return c.json(
    responses.ok(
      (result.results || []).map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        lastUsedAt: row.last_used_at,
      }))
    )
  );
});

passkeyRoutes.post('/user/passkeys', createAuthMiddleware({ required: true }), async (c) => {
  if (!c.env.JWT_SECRET) {
    return c.json(responses.serverError('Missing JWT secret'), 503);
  }

  const user = getUser(c)!;
  const body = await c.req.json().catch(() => ({}));
  const response = body.credential as RegistrationResponseJSON | undefined;
  const { origin, rpID } = getPasskeyConfig(c);

  if (!response) {
    const existing = await c.env.DB.prepare(
      'SELECT credential_id, transports FROM passkeys WHERE user_id = ?'
    )
      .bind(user.id)
      .all<{ credential_id: string; transports: string }>();
    const options = await generateRegistrationOptions({
      rpName: 'Doggy Nav',
      rpID,
      userID: new Uint8Array(new TextEncoder().encode(user.id).buffer as ArrayBuffer),
      userName: user.username,
      userDisplayName: user.username,
      attestationType: 'none',
      excludeCredentials: (existing.results || []).map((row) => ({
        id: row.credential_id,
        transports: JSON.parse(row.transports || '[]'),
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    });
    await setChallenge(c, 'registration', options.challenge, user.id);
    return c.json(responses.ok(options));
  }

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: await consumeChallenge(c, 'registration', user.id),
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    const credential = verification.registrationInfo?.credential;
    if (!verification.verified || !credential || !verification.registrationInfo) {
      throw new Error('Unverified registration');
    }

    const count = await c.env.DB.prepare('SELECT COUNT(*) AS count FROM passkeys WHERE user_id = ?')
      .bind(user.id)
      .first<{ count: number }>();
    const kind = response.authenticatorAttachment === 'cross-platform' ? 'Security key' : 'Passkey';
    await c.env.DB.prepare(
      `INSERT INTO passkeys
        (id, user_id, credential_id, public_key, counter, transports, device_type, backed_up, name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        newId24(),
        user.id,
        credential.id,
        isoBase64URL.fromBuffer(credential.publicKey),
        credential.counter,
        JSON.stringify(credential.transports || []),
        verification.registrationInfo.credentialDeviceType,
        verification.registrationInfo.credentialBackedUp ? 1 : 0,
        `${kind} ${Number(count?.count || 0) + 1}`
      )
      .run();
    return c.json(responses.ok({ registered: true }));
  } catch (error) {
    console.warn('Passkey registration failed', error);
    const duplicate = error instanceof Error && /unique/i.test(error.message);
    return c.json(
      responses.badRequest(
        duplicate
          ? 'This passkey is already registered'
          : 'Passkey registration could not be verified'
      ),
      400
    );
  }
});

passkeyRoutes.delete('/user/passkeys/:id', createAuthMiddleware({ required: true }), async (c) => {
  const user = getUser(c)!;
  const result = await c.env.DB.prepare('DELETE FROM passkeys WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id)
    .run();
  if (!result.meta.changes) {
    return c.json(responses.notFound('Passkey not found'), 404);
  }
  return c.json(responses.ok({ deleted: true }));
});

export default passkeyRoutes;
