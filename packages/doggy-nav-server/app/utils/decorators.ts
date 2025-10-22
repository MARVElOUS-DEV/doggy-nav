import { Context } from '../../typings/app';
import { setAuthCookies } from './authCookie';

// Decorator: when X-App-Source=admin, only allow admin/sysadmin to proceed.
// Expects the original method to return an object like { tokens, token, user } without writing response.
export function EnforceAdminOnAdminSource(): MethodDecorator {
  return function(_target: any, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value as (...args: any[]) => Promise<any>;
    descriptor.value = async function(...args: any[]) {
      const res = await original.apply(this, args);
      const ctx = this.ctx as Context;
      const src = (ctx?.get?.('X-App-Source') || '').toLowerCase();
      if (src === 'admin') {
        const roles: string[] = Array.isArray(res?.user?.roles) ? res.user.roles : [];
        if (!(roles.includes('admin') || roles.includes('sysadmin'))) {
          ctx.status = 403;
          this.error('权限不足');
          return;
        }
      }
      if (res?.tokens) setAuthCookies(ctx, res.tokens);
      this.success({ token: res?.token, user: res?.user });
      return;
    };
    return descriptor;
  };
}
