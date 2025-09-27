module.exports = (_options, app) => {
  return async function(ctx, next) {
    const routerAuth = app.config.routerAuth;
    let url = ctx.url;
    if (url.includes('?')) {
      url = url.split('?')[0];
    }

    const flag = routerAuth.includes(url);
    if (flag) {
      await next();
    } else {
      let token = ctx.headers.authorization ? ctx.headers.authorization : '';
      const clientSecret = ctx.headers['x-client-secret'];

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
              await next();
            } else {
              ctx.status = 401;
              ctx.body = {
                code: 401,
                msg: '无效的客户端密钥',
                data: null,
              };
            }
          } else {
            ctx.status = 401;
            ctx.body = {
              code: 401,
              msg: '无效的客户端密钥',
              data: null,
            };
          }
        } catch (err: any) {
          ctx.status = 401;
          ctx.body = {
            code: 401,
            msg: '客户端密钥验证失败',
            data: null,
          };
        }
      } else if (token) {
        token = token.substring(7);
        try {
          const decode = await app.jwt.verify(token, app.config.jwt.secret);
          ctx.state.userinfo = {
            ...decode,
            authType: 'jwt',
          };
          await next();
        } catch (err: any) {
          ctx.status = 401;
          ctx.body = {
            code: 401,
            msg: 'token失效或解析错误',
            data: null,
          };
        }
      } else {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          msg: '未提供认证信息',
          data: null,
        };
      }
    }
  };
};
