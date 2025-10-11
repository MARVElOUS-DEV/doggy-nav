import { getRoutePermission, hasAccess } from '../access-control';

export default () => {
  return async function(ctx: any, next: any) {
    let url = ctx.url;
    if (url.includes('?')) {
      url = url.split('?')[0];
    }

    // FIRST: Check client secret if enabled (for ALL endpoints)
    const clientSecretConfig = ctx.app.config.clientSecret;
    const isClientSecretRequired = clientSecretConfig?.requireForAllAPIs;
    const bypassRoutes = clientSecretConfig?.bypassRoutes || [];

    // Check if this route is in bypass list
    const isBypassRoute = bypassRoutes.some((route: string) => {
      if (route === url) return true;
      // Handle path parameters for bypass routes
      const routeParts = route.split('/');
      const urlParts = url.split('/');
      if (routeParts.length !== urlParts.length) return false;
      return routeParts.every((part: string, index: number) => {
        return part.startsWith(':') || part === urlParts[index];
      });
    });

    if (isClientSecretRequired && !isBypassRoute) {
      // Require client secret for ALL APIs
      const clientSecret = ctx.headers[clientSecretConfig?.headerName || 'x-client-secret'];

      if (!clientSecret) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          msg: '请提供客户端密钥',
          data: null,
        };
        return;
      }

      // Verify client secret
      try {
        const isValid = await ctx.service.clientSecret.verifyClientSecret(clientSecret);
        if (!isValid) {
          ctx.status = 401;
          ctx.body = {
            code: 401,
            msg: '无效的客户端密钥',
            data: null,
          };
          return;
        }

        // Store the application info in context for potential future use
        const application = await ctx.service.clientSecret.getApplicationByClientSecret(clientSecret);
        if (application) {
          ctx.state.clientApplication = {
            id: application._id,
            name: application.name,
            authType: 'client_secret',
          };
        }
      } catch (e) {
        ctx.logger.error('Client secret verification error:', e);
        ctx.status = 500;
        ctx.body = {
          code: 500,
          msg: '客户端密钥验证失败',
          data: null,
        };
        return;
      }
    }

    // SECOND: Check route permissions and user authentication
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

    // If public access, allow without user authentication
    if (permission.access === 'public') {
      await next();
      return;
    }

    // For optional access, proceed without requiring authentication
    // but still try to authenticate if credentials are provided
    if (permission.access === 'optional') {
      // Try to authenticate but don't require it
      await tryAuthenticate(ctx, ctx.app);
      await next();
      return;
    }

    // For authenticated and admin access, try to authenticate
    const authResult = await tryAuthenticate(ctx, ctx.app);

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
      ctx.logger.debug('JWT authentication error:', err);
      return { authenticated: false, error: 'token失效或解析错误' };
    }
  }

  // No authentication credentials provided
  return { authenticated: false, error: '未提供认证信息' };
}
