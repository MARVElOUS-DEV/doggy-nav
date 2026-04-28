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
    clientApplication?: {
      id: string;
      name: string;
      authType: 'client_secret';
    };
  }
}
export type Env = {
  DB: D1Database;
  JWT_SECRET?: string;
  TOOL_OUTPUT_REQUIRE_HTTPS?: string;
  NODE_ENV?: string;
  RATE_LIMIT_ENABLED?: string;
  REQUIRE_CLIENT_SECRET?: string;
  CLIENT_SECRET_HEADER?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_SUPPORT_BASE_URL?: string;
  STRIPE_SUPPORT_SUCCESS_URL?: string;
  STRIPE_SUPPORT_CANCEL_URL?: string;
  STRIPE_SUPPORT_CREATOR_NAME?: string;
};
