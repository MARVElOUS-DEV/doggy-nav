import assert from 'assert';
import { Context } from 'egg';
import { app, mock } from 'egg-mock/bootstrap';

async function expectReject(action: () => Promise<unknown>, message: RegExp) {
  try {
    await action();
    throw new Error('expected action to reject');
  } catch (error: any) {
    assert(message.test(String(error?.message || error)));
  }
}

describe('refresh session rotation', () => {
  let ctx: Context;

  afterEach(() => {
    mock.restore();
  });

  it('rotates a tracked token and revokes the session when an old token is replayed', async () => {
    ctx = app.mockContext();
    const session: any = {};
    const user = {
      _id: '507f1f77bcf86cd799439011',
      username: 'session-user',
      isActive: true,
      roles: [],
      groups: [],
      extraPermissions: [],
    };

    mock(ctx.model.User, 'findById', () => ({ lean: async () => user }) as any);
    mock(ctx.model.RefreshSession, 'create', async (doc: any) => {
      Object.assign(session, doc, { revokedAt: null, previousTokenHash: null, rotatedAt: null });
      return session;
    });
    mock(
      ctx.model.RefreshSession,
      'findOne',
      () => ({ lean: async () => ({ ...session }) }) as any
    );
    mock(ctx.model.RefreshSession, 'updateOne', async (filter: any, update: any) => {
      if (filter.currentTokenHash && filter.currentTokenHash !== session.currentTokenHash) {
        return { modifiedCount: 0 };
      }
      Object.assign(session, update.$set || {});
      return { modifiedCount: 1 };
    });

    const issued = await ctx.service.user.generateTokens(user, 'main');
    const accessPayload = app.jwt.verify(issued.accessToken, app.config.jwt.secret, {
      algorithms: ['HS256'],
    }) as any;
    const refreshPayload = app.jwt.verify(issued.refreshToken, app.config.jwt.secret, {
      algorithms: ['HS256'],
    }) as any;
    assert.strictEqual(accessPayload.typ, 'access');
    assert.strictEqual(refreshPayload.typ, 'refresh');
    assert.strictEqual(refreshPayload.sid, session._id.toString());

    await expectReject(
      () => ctx.service.user.rotateRefreshToken(issued.accessToken, 'main'),
      /Invalid refresh token/
    );
    assert.strictEqual(session.revokedAt, null);

    const rotated = await ctx.service.user.rotateRefreshToken(issued.refreshToken, 'main');
    assert.notStrictEqual(rotated.refreshToken, issued.refreshToken);

    session.rotatedAt = new Date(Date.now() - 11_000);
    await expectReject(
      () => ctx.service.user.rotateRefreshToken(issued.refreshToken, 'main'),
      /reuse detected/
    );
    assert(session.revokedAt instanceof Date);
  });

  it('rejects inactive users before issuing refreshed credentials', async () => {
    ctx = app.mockContext();
    mock(
      ctx.model.User,
      'findById',
      () =>
        ({
          lean: async () => ({
            _id: '507f1f77bcf86cd799439012',
            username: 'inactive-user',
            isActive: false,
            roles: [],
            groups: [],
          }),
        }) as any
    );

    await expectReject(
      () => ctx.service.user.getAuthUserForTokens('507f1f77bcf86cd799439012'),
      /用户不存在/
    );
  });
});
