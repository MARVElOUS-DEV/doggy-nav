import { Application } from 'egg';
import { isProviderEnabled } from './utils/oauth';

export default (app: Application) => {
  const { controller, router } = app;
  const passport = (app as any).passport;
  
  router.post('/api/auth/logout', controller.auth.logout);
  router.get('/api/auth/providers', controller.auth.providers);
  router.get('/api/auth/me', controller.auth.me);

  // OAuth init route (dynamic provider)
  router.get('/api/auth/:provider', controller.auth.oauthInit);

  // OAuth callback route (dynamic provider)
  router.get('/api/auth/:provider/callback', async (ctx, next) => {
    const provider = ctx.params.provider;
    if (!passport || !isProviderEnabled(app, provider)) {
      ctx.status = 404;
      ctx.body = { code: 404, msg: 'Provider not found', data: null };
      return;
    }
    const failureRedirect = `/login?err=oauth_${provider}`;
    const middleware = passport.authenticate(provider, { session: false, failureRedirect });
    return middleware(ctx, next);
  }, controller.auth.issueTokenAndRedirect);

  router.post('/api/register', controller.user.register);
  router.post('/api/login', controller.user.login);
  router.get('/api/user/profile', controller.user.profile);
  router.put('/api/user/profile', controller.user.updateProfile);

  // Application routes
  router.post('/api/application', controller.application.create);
  router.get('/api/application/list', controller.application.list);
  router.put('/api/application/:id', controller.application.update);
  router.post('/api/application/:id/regenerate-secret', controller.application.regenerateSecret);
  router.delete('/api/application/:id/revoke', controller.application.revoke);
  router.post('/api/application/verify-client-secret', controller.application.verifyClientSecret);

  router.post('/api/category', controller.category.add);
  router.delete('/api/category', controller.category.del);
  router.put('/api/category', controller.category.edit);
  router.get('/api/category/list', controller.category.list);

  router.get('/api/nav/list', controller.nav.list);
  router.post('/api/nav', controller.nav.add);
  router.get('/api/nav', controller.nav.get);
  router.put('/api/nav/audit', controller.nav.audit);
  router.get('/api/nav/reptile', controller.nav.reptile);
  router.get('/api/nav/random', controller.nav.random);
  router.delete('/api/nav', controller.nav.del);
  router.put('/api/nav', controller.nav.edit);
  router.get('/api/nav/find', controller.nav.info);
  router.get('/api/nav/ranking', controller.nav.ranking);
  router.post('/api/nav/:id/view', controller.nav.incrementView);
  router.post('/api/nav/:id/star', controller.nav.incrementStar);

  router.post('/api/tag', controller.tag.add);
  router.delete('/api/tag', controller.tag.remove);
  router.put('/api/tag', controller.tag.update);
  router.get('/api/tag/list', controller.tag.getList);

  // URL Checker routes
  router.get('/api/url-checker/status', controller.urlChecker.status);
  router.post('/api/url-checker/start', controller.urlChecker.start);
  router.post('/api/url-checker/stop', controller.urlChecker.stop);
  router.post('/api/url-checker/restart', controller.urlChecker.restart);
  router.put('/api/url-checker/config', controller.urlChecker.updateConfig);
  router.post('/api/url-checker/check', controller.urlChecker.triggerCheck);
  router.post('/api/url-checker/check/:id', controller.urlChecker.checkNavItem);
  router.get('/api/url-checker/nav-status', controller.urlChecker.getNavUrlStatus);

  // Favorite routes - require authentication
  router.post('/api/favorites', controller.favorite.add);
  router.post('/api/favorites/remove', controller.favorite.remove);
  router.get('/api/favorites/list', controller.favorite.list);
  router.get('/api/favorites/structured', controller.favorite.structured);
  router.post('/api/favorites/folders', controller.favorite.createFolder);
  router.put('/api/favorites/folders/:id', controller.favorite.updateFolder);
  router.delete('/api/favorites/folders/:id', controller.favorite.deleteFolder);
  router.put('/api/favorites/placements', controller.favorite.placements);
  router.get('/api/favorites/check', controller.favorite.check);
  router.get('/api/favorites/count', controller.favorite.count);
};
