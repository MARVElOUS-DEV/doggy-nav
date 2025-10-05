import { Context } from 'egg';
import { AppError } from '../core/errors';

export default () => {
  return async (ctx: Context, next: () => Promise<any>) => {
    try {
      await next();
    } catch (err: any) {
      // Log full error details for debugging (server-side only)
      ctx.logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: ctx.url,
        method: ctx.method,
        body: ctx.request.body,
        query: ctx.query,
      });

      // Determine error response
      if (err instanceof AppError) {
        // Known operational errors - safe to send message to client
        ctx.status = err.statusCode;
        ctx.body = {
          code: 0,
          msg: err.message,
          data: null,
        };
      } else if (err.name === 'ValidationError') {
        // Mongoose validation error
        ctx.status = 400;
        ctx.body = {
          code: 0,
          msg: '数据验证失败',
          data: null,
        };
      } else if (err.name === 'UnauthorizedError' || err.status === 401) {
        // JWT authentication error
        ctx.status = 401;
        ctx.body = {
          code: 0,
          msg: '未授权，请先登录',
          data: null,
        };
      } else {
        // Unknown/system errors - send generic message
        ctx.status = err.status || 500;
        ctx.body = {
          code: 0,
          msg: '服务器内部错误，请稍后重试',
          data: null,
        };
      }

      // Emit error event for monitoring
      ctx.app.emit('error', err, ctx);
    }
  };
};
