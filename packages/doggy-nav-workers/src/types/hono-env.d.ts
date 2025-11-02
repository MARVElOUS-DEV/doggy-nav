import type { Container } from 'doggy-nav-core';

declare module 'hono' {
  interface ContextVariableMap {
    di: Container;
    user?: {
      id: string;
      email: string;
      username: string;
      roles: string[];
      groups: string[];
      permissions: string[];
      nickName?: string;
      avatar?: string | null;
    };
  }
}
