import type { Token } from 'doggy-nav-core';

export function Inject<T>(token: Token<T>) {
  return function (target: any, propertyKey: string | symbol) {
    const cacheKey = Symbol(`__di_${String(propertyKey)}`);
    Object.defineProperty(target, propertyKey, {
      get: function (this: any) {
        if (!this[cacheKey]) {
          const di = this?.ctx?.di;
          if (!di) throw new Error('DI container not found on ctx');
          this[cacheKey] = di.resolve(token);
        }
        return this[cacheKey];
      },
      enumerable: true,
      configurable: true,
    });
  };
}
