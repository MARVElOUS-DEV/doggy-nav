import { Application } from 'egg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

export default (app: Application) => {
  app.beforeStart(async () => {
    app.logger.info('Application is starting...');
    app.logger.info(`Using MongoDB URL: ${app.config?.mongoose?.client?.url}`);
  });

  app.ready(async () => {
    app.logger.info('Application is ready');

    // Start URL checker timer if enabled
    if (app.config.urlChecker.autoStart && app.config.urlChecker.enabled) {
      app.logger.info('Auto-starting URL checker timer');
      try {
        await app.createAnonymousContext().service.urlCheckerTimer.start();
      } catch (error) {
        app.logger.error('Failed to start URL checker timer:', error);
      }
    }
  });

  app.beforeClose(async () => {
    app.logger.info('Application is closing...');

    // Stop URL checker timer
    try {
      const ctx = app.createAnonymousContext();
      if (ctx.service.urlCheckerTimer) {
        ctx.service.urlCheckerTimer.stop();
      }
    } catch (error) {
      app.logger.error('Error stopping URL checker timer:', error);
    }
  });
};
