import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};

  // Use a dedicated test database with very short timeouts to avoid hanging CI
  config.mongoose = {
    client: {
      url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/navigation_test',
      // Keep timeouts low so tests don’t wait for real DB in CI
      options: {
        serverSelectionTimeoutMS: 200,
        socketTimeoutMS: 200,
      } as any,
    },
  } as any;

  // Ensure background jobs are disabled in unit tests
  (config as any).urlChecker = {
    enabled: false,
    autoStart: false,
  };

  // In unit tests we don’t require client secret
  (config as any).clientSecret = {
    requireForAllAPIs: false,
  };

  return config;
};
