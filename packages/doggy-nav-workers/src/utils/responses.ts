export const responses = {
  ok: (data: any, message: string = 'ok') => ({ code: 1, msg: message, data }),
  err: (message: string, code: number = 0) => ({ code, msg: message, data: null }),
  notFound: (message: string = 'Resource not found') => ({ code: 404, msg: message, data: null }),
  badRequest: (message: string = 'Bad request') => ({ code: 400, msg: message, data: null }),
  serverError: (message: string = 'Internal server error') => ({ code: 500, msg: message, data: null }),
};
