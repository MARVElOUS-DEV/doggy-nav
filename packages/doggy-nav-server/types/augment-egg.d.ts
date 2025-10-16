import 'egg';
import 'egg-mongoose';
import { Mongoose, Types, ConnectOptions } from 'mongoose';

// Global lightweight passport typings suitable for egg-passport usage
declare global {
  type OAuthVerifyCallback = (err: any, user?: any, info?: any) => void;
  type OAuthStrategyCtor<TOptions = any> = new (
    options: TOptions,
    verify: (accessToken: string, refreshToken: string, profile: any, done: OAuthVerifyCallback) => void,
  ) => any;

  interface EggPassport {
    use(strategy: any): this;
    use<TOptions = any>(strategy: OAuthStrategyCtor<TOptions>): this;
    authenticate(
      strategy: string,
      options?: any,
    ): (ctx: any, next: () => Promise<any>) => Promise<any> | void;
    verify(fn: (ctx: any, user: any) => any | Promise<any>): void;
    serializeUser(fn: (ctx: any, user: any) => any | Promise<any>): void;
    deserializeUser(fn: (ctx: any, user: any) => any | Promise<any>): void;
  }
}

declare module 'egg' {
  interface Application {
    mongoose: Mongoose & { Types: typeof Types };
    jwt: {
      sign(payload: any, secret: string, options?: any): string;
      verify(token: string, secret: string, options?: any): any;
    };
    passport: EggPassport;
  }

  interface EggAppConfig {
    mongoose: {
      url: string;
      options?: ConnectOptions;
    };
    jwt: {
      secret: string;
      accessExpiresIn: string
      refreshExpiresIn: string
    };
  }

  interface Context {
    model: any;
  }
}

declare module 'egg-mock' {
  interface MockApplication {
    jwt: {
      sign(payload: any, secret: string, options?: any): string;
      verify(token: string, secret: string, options?: any): any;
    };
  }
}
