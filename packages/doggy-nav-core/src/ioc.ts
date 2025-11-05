export type Token<T> = symbol & { __t?: T };

export function makeToken<T>(desc: string): Token<T> {
  return Symbol(desc) as Token<T>;
}

export class Container {
  private registry = new Map<symbol, (c: Container) => unknown>();
  register<T>(token: Token<T>, factory: (c: Container) => T): this {
    this.registry.set(token, factory as any);
    return this;
  }
  resolve<T>(token: Token<T>): T {
    const f = this.registry.get(token as any);
    if (!f) throw new Error('IoC token not registered');
    return (f as (c: Container) => T)(this);
  }
  tryResolve<T>(token: Token<T>): T | undefined {
    const f = this.registry.get(token as any);
    return f ? (f as (c: Container) => T)(this) : undefined;
  }
}
