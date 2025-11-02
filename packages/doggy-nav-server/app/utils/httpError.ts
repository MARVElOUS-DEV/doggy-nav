export function mapAndSendError(ctx: any, err: any) {
  const name = err?.name || '';
  if (name === 'NotFoundError') {
    ctx.status = 404;
    ctx.body = { code: 404, msg: err.message || 'Not Found', data: null };
    return;
  }
  if (name === 'ValidationError') {
    ctx.status = 400;
    ctx.body = { code: 400, msg: err.message || 'Bad Request', data: null };
    return;
  }
  ctx.status = 500;
  ctx.body = { code: 500, msg: 'Internal Server Error', data: null };
}
