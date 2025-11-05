import type { Context } from 'hono';
import type { Container } from 'doggy-nav-core';

export function getDI(c: Context): Container {
  return c.get('di');
}

export type UserCtx = NonNullable<ReturnType<typeof getUser>>;

export function getUser(c: Context) {
  return c.get('user') as {
    id: string;
    email: string;
    username: string;
    roles: string[];
    groups: string[];
    permissions: string[];
    nickName?: string;
    avatar?: string | null;
  } | undefined;
}
