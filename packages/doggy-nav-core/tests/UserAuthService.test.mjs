import assert from 'node:assert/strict';
import { CategoryService, UserAuthService } from '../dist/index.js';

const groupId = 'group-a-id';
const authUser = {
  id: 'user-1',
  username: 'oauth-user',
  email: 'oauth-user@example.com',
  avatar: null,
  roles: ['user'],
  roleIds: ['role-user-id'],
  groups: ['group-a'],
  groupIds: [groupId],
  permissions: [],
};

const authService = new UserAuthService({
  async verifyCredentials(identifier, password) {
    return identifier === authUser.email && password === 'reset-password'
      ? { userId: authUser.id }
      : null;
  },
  async loadAuthUser() {
    return authUser;
  },
  async recordSuccessfulLogin() {},
});

let issuedPayload;
const login = await authService.login(authUser.email, 'reset-password', async (payload) => {
  issuedPayload = payload;
  return { accessToken: 'access-token', refreshToken: 'refresh-token' };
});

assert.deepEqual(issuedPayload.roleIds, authUser.roleIds);
assert.deepEqual(issuedPayload.groupIds, authUser.groupIds);
assert.deepEqual(login.user.groupIds, authUser.groupIds);

const categoryService = new CategoryService({
  async listAll() {
    return [
      {
        id: 'category-a',
        categoryId: 'root',
        name: 'Group A category',
        audience: { visibility: 'restricted', allowGroups: [groupId] },
      },
    ];
  },
});

const visible = await categoryService.listTree(issuedPayload, { rootId: 'root' });
assert.deepEqual(
  visible.map((category) => category.id),
  ['category-a']
);
