import { getRoutePermission, hasAccess } from '../../access-control';

export default (app: any) => {
  return async function(ctx: any, next: any) {
    let url = ctx.url;
    if (url.includes('?')) {
      url = url.split('?')[0];
    }

    // Get the route permission for this endpoint
    const permission = getRoutePermission(ctx.method, url);

    // If no permission rule found, default to authenticated (secure by default)
    if (!permission) {
      ctx.status = 403;
      ctx.body = {
        code: 403,
        msg: '访问被拒绝：未配置权限',
        data: null,
      };
      return;
    }

    // If public access, allow without authentication
    if (permission.access === 'public') {
      await next();
      return;
    }

    // For optional access, proceed without requiring authentication
    // but still try to authenticate if credentials are provided
    if (permission.access === 'optional') {
      // Try to authenticate but don't require it
      await tryAuthenticate(ctx, app);
      await next();
      return;
    }

    // For authenticated and admin access, try to authenticate
    const authResult = await tryAuthenticate(ctx, app);

    // Check if user has required access level
    if (hasAccess(permission, ctx.state.userinfo)) {
      await next();
    } else {
      // Authentication failed or user doesn't have required permissions
      if (authResult.authenticated) {
        // User is authenticated but doesn't have required permissions
        ctx.status = 403;
        ctx.body = {
          code: 403,
          msg: '权限不足',
          data: null,
        };
      } else {
        // User is not authenticated
        ctx.status = 401;
        ctx.body = {
          code: 401,
          msg: authResult.error || '需要身份验证',
          data: null,
        };
      }
    }
  };
};

// Helper function to attempt authentication
async function tryAuthenticate(ctx: any, app: any) {
  let token = ctx.headers.authorization ? ctx.headers.authorization : '';
  const clientSecret = ctx.headers['x-client-secret'];

  // Try client secret authentication first
  if (clientSecret) {
    try {
      const isValid = await ctx.service.clientSecret.verifyClientSecret(clientSecret);
      if (isValid) {
        const user = await ctx.service.clientSecret.getUserByClientSecret(clientSecret);
        if (user) {
          ctx.state.userinfo = {
            userId: user._id,
            username: user.username,
            isAdmin: user.isAdmin,
            authType: 'client_secret',
          };
          return { authenticated: true };
        }
        return { authenticated: false, error: '无效的客户端密钥' };
      }
      return { authenticated: false, error: '无效的客户端密钥' };
    } catch (e) {
      this.ctx.logger.error('Client secret authentication error:', e);
      return { authenticated: false, error: '客户端密钥验证失败' };
    }
  }

  // Try JWT token authentication
  if (token) {
    token = token.substring(7); // Remove 'Bearer ' prefix
    try {
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      ctx.state.userinfo = {
        ...decode,
        authType: 'jwt',
      };
      return { authenticated: true };
    } catch (err) {
      this.ctx.logger.error('JWT authentication error:', err);
      return { authenticated: false, error: 'token失效或解析错误' };
    }
  }

  // No authentication credentials provided
  return { authenticated: false, error: '未提供认证信息' };
}
