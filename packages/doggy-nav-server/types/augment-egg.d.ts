import 'egg';
import 'egg-mongoose';
import { Mongoose, Types, ConnectOptions } from 'mongoose';

declare module 'egg' {
  interface Application {
    mongoose: Mongoose & { Types: typeof Types };
    jwt: {
      sign(payload: any, secret: string, options?: any): string;
      verify(token: string, secret: string, options?: any): any;
    };
  }

  interface EggAppConfig {
    mongoose: {
      url: string;
      options?: ConnectOptions;
    };
    jwt: {
      secret: string;
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
