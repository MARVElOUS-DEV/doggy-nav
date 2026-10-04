import { mock } from 'egg-mock/bootstrap';
import MongooseAuthRepository from '../../adapters/authRepository';

// Tokens no longer establish account state. Tests using synthetic accounts must
// also provide the current repository result rather than rely on token claims.
const users = new Map<string, any>();
export function mockAuthUser(payload: any) {
  users.set(payload.userId, {
    id: payload.userId,
    username: payload.username || 'test',
    roles: payload.roles || [],
    roleIds: payload.roleIds || [],
    groups: payload.groups || [],
    groupIds: payload.groupIds || [],
    permissions: payload.permissions || [],
  });
  mock(MongooseAuthRepository.prototype, 'loadAuthUser', async (userId: string) => {
    const user = users.get(userId);
    if (!user) throw new Error('User not found');
    return user;
  });
}
