import { Application } from 'egg';
import createOAuthCallback from './middleware/oauthCallback';

export default (app: Application) => {
  const { controller, router } = app;
  const oauthCallback = createOAuthCallback();

  router.post('/api/auth/logout', controller.auth.logout);
  router.get('/api/auth/providers', controller.auth.providers);
  router.get('/api/auth/me', controller.auth.me);
  router.post('/api/auth/refresh', controller.auth.refresh);
  router.get('/api/auth/config', controller.auth.getAuthConfig);
  router.post('/api/auth/register', controller.user.register);
  router.post('/api/auth/login', controller.user.login);
  // OAuth callback route (dynamic provider), Note: dynamic route should be after the common ones.
  router.get('/api/auth/:provider/callback', oauthCallback, controller.auth.issueTokenAndRedirect);
  // OAuth init route (dynamic provider)
  router.get('/api/auth/:provider', controller.auth.oauthInit);

  router.get('/api/user/profile', controller.user.profile);
  router.put('/api/user/profile', controller.user.updateProfile);
  // Admin user management
  router.get('/api/user', controller.user.adminList);
  router.get('/api/user/:id', controller.user.adminGetOne);
  router.post('/api/user', controller.user.adminCreate);
  router.patch('/api/user/:id', controller.user.adminUpdate);
  router.delete('/api/user', controller.user.adminDelete);
  // RBAC resources
  router.get('/api/roles', controller.role.getList);
  router.post('/api/roles', controller.role.add);
  router.put('/api/roles', controller.role.edit);
  router.delete('/api/roles', controller.role.del);

  router.get('/api/groups', controller.group.getList);
  router.get('/api/groups/:id', controller.group.getOne);
  router.post('/api/groups', controller.group.add);
  router.put('/api/groups', controller.group.edit);
  router.put('/api/groups/:id', controller.group.update);
  router.post('/api/groups/:id/members', controller.group.addMembers);
  router.delete('/api/groups', controller.group.del);
  // invitation code routes
  router.get('/api/invite-codes/list', controller.inviteCode.list);
  router.post('/api/invite-codes', controller.inviteCode.create);
  router.put('/api/invite-codes/:id', controller.inviteCode.update);
  router.post('/api/invite-codes/:id/revoke', controller.inviteCode.revoke);

  // Application routes
  router.post('/api/application', controller.application.create);
  router.get('/api/application/list', controller.application.list);
  router.post('/api/application/verify-client-secret', controller.application.verifyClientSecret);
  router.put('/api/application/:id', controller.application.update);
  router.post('/api/application/:id/regenerate-secret', controller.application.regenerateSecret);
  router.delete('/api/application/:id/revoke', controller.application.revoke);

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
  router.put('/api/favorites/placements', controller.favorite.placements);
  router.get('/api/favorites/check', controller.favorite.check);
  router.get('/api/favorites/count', controller.favorite.count);
  router.put('/api/favorites/folders/:id', controller.favorite.updateFolder);
  router.delete('/api/favorites/folders/:id', controller.favorite.deleteFolder);

  // Translation routes
  router.post('/api/translate', controller.translate.translate);

  // Prompt management routes
  router.get('/api/prompts', controller.prompt.list);
  router.post('/api/prompts', controller.prompt.add);
  router.put('/api/prompts', controller.prompt.update);
  router.delete('/api/prompts', controller.prompt.remove);
  router.post('/api/prompts/:id/activate', controller.prompt.setActive);

  // AI inference routes (OpenAI-compatible)
  router.post('/v1/chat/completions', controller.ai.chatCompletions);
  // Admin-friendly alias under /api (proxied in dev)
  router.post('/api/ai/chat', controller.ai.chatCompletions);

  // Email settings routes
  router.get('/api/email-settings', controller.emailSettings.get);
  router.put('/api/email-settings', controller.emailSettings.update);
  router.post('/api/email-settings/test', controller.emailSettings.test);
  router.get('/api/email-settings/health', controller.emailSettings.health);
};
