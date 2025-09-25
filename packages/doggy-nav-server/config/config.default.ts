import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import mongoConfig from './mongodb';
import { ConnectOptions } from 'mongoose';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.keys = 'doggy-nav';

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.cluster = {
    listen: {
      port: 3002,
      hostname: '0.0.0.0',
    },
  };

  config.mongoose = {
    client: {
      url: mongoConfig.mongoUrl,
      options: { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true } as ConnectOptions,
    },
  };

  config.middleware = [ 'error', 'auth' ];
  config.error = {
    postFormat: (_e, { stack, ...rest }) => (appInfo.env === 'prod' ? rest : { stack, ...rest }),
  };

  config.jwt = {
    secret: 'a_strange_jwt_token_when_you_see_it',
  };

  config.routerAuth = [
    '/api/nav',
    '/api/nav/random',
    '/api/nav/find',
    '/api/nav/list',
    '/api/nav/reptile',
    '/api/nav/ranking',
    '/api/login',
    '/api/index',
    '/api/category/list',
    '/api/tag/list',
    '/api/url-checker/status',
    '/api/url-checker/nav-status',
  ];

  // URL Checker Configuration
  config.urlChecker = {
    // Enable/disable URL checking
    enabled: false,
    // Cron expression for scheduling checks (default: every 6 hours)
    cronExpression: '0 */6 * * *',
    // Maximum age for last check before rechecking (default: 1 hour)
    maxCheckAge: 60 * 60 * 1000,
    // Number of concurrent URL checks (default: 5)
    concurrentChecks: 5,
    // Batch size for processing nav items (default: 100)
    batchSize: 100,
    // Timeout for individual URL checks in milliseconds (default: 5 seconds)
    requestTimeout: 5000,
    // Auto-start timer on application startup
    autoStart: true,
  };

  return {
    ...config,
  };
};
