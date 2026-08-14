import assert from 'assert';
import { Types } from 'mongoose';
import { UserAuthService } from 'doggy-nav-core';
import MongooseAuthRepository from '../../../adapters/authRepository';

describe('MongooseAuthRepository', () => {
  it('carries role and group ids through password-login token composition', async () => {
    const userId = new Types.ObjectId();
    const roleId = new Types.ObjectId();
    const groupId = new Types.ObjectId();
    const role = { _id: roleId, slug: 'user', permissions: ['category:list'] };
    const group = { _id: groupId, slug: 'group-a' };
    const user = {
      _id: userId,
      username: 'oauth-user',
      email: 'oauth-user@example.com',
      avatar: null,
      roles: [roleId],
      groups: [groupId],
      extraPermissions: ['nav:list'],
    };

    const matchingDocs = (filter: any, doc: any) => (filter?._id?.$in?.length > 0 ? [doc] : []);
    const ctx = {
      model: {
        User: {
          findById: () => ({ lean: async () => user }),
        },
        Role: {
          find: (filter: any) => ({ lean: async () => matchingDocs(filter, role) }),
        },
        Group: {
          find: (filter: any) => ({ lean: async () => matchingDocs(filter, group) }),
        },
      },
    };

    const repository = new MongooseAuthRepository(ctx);
    repository.verifyCredentials = async () => ({ userId: userId.toString() });
    repository.recordSuccessfulLogin = async () => {};

    let issuedPayload: any;
    const result = await new UserAuthService(repository).login(
      user.email,
      'reset-password',
      async (payload) => {
        issuedPayload = payload;
        return { accessToken: 'access-token' };
      }
    );

    assert.deepStrictEqual(issuedPayload.roleIds, [roleId.toString()]);
    assert.deepStrictEqual(issuedPayload.groupIds, [groupId.toString()]);
    assert.deepStrictEqual(issuedPayload.permissions.sort(), ['category:list', 'nav:list']);
    assert.deepStrictEqual(result?.user.groupIds, [groupId.toString()]);
  });
});
