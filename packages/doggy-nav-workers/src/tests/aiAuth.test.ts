import { getRoutePermission, hasAccess } from 'doggy-nav-core';

describe('similar navigation recommendations', () => {
  it('requires authentication in the shared access matrix', () => {
    const permission = getRoutePermission('POST', '/api/ai/tasks/similar-nav');

    expect(permission).toBeDefined();
    expect(hasAccess(permission!, undefined)).toBe(false);
    expect(hasAccess(permission!, { roles: ['user'] })).toBe(true);
  });
});
