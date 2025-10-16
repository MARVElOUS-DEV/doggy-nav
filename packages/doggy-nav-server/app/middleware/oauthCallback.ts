import type { Context } from 'egg';
import { isProviderEnabled } from '../utils/oauth';

type Next = () => Promise<void>;

export default () => {
  return async function oauthProviderCallback(ctx: Context, next: Next) {
    const { app } = ctx;
    const passport = app.passport;
    const provider = ctx.params.provider;

    if (!passport || !isProviderEnabled(app, provider)) {
      ctx.status = 404;
      ctx.body = { code: 404, msg: 'Provider not found', data: null };
      return;
    }

    const failureRedirect = `/login?err=oauth_${provider}`;
    const middleware = passport.authenticate(provider, { session: false, failureRedirect });

    await middleware(ctx, next);
    // as our backend do not serve to the browser client, we should pass the redirect to the nextjs route api
    if (ctx.status >= 300 && ctx.status < 400) {
      await next();
    }
  };
};
