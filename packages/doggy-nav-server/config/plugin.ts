import { EggPlugin } from 'egg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const plugin: EggPlugin = {
  mongoose: {
    enable: true,
    package: 'egg-mongoose',
  },
  jwt: {
    enable: true,
    package: 'egg-jwt',
  },
  passport: {
    enable: true,
    package: 'egg-passport',
  },
  cors: {
    enable: true,
    package: 'egg-cors',
  },
  // Temporarily disable rate limiter due to configuration issues
  // ratelimiter: {
  //   enable: true,
  //   package: 'egg-ratelimiter',
  // },
};

export default plugin;
