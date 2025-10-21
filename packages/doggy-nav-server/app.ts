import { Application } from 'egg';
import { registerOAuthStrategies } from './app/utils/oauth';
import normalizePlugin from './app/utils/mongoose/normalize';

export default (app: Application) => {
  registerOAuthStrategies(app);

  // Apply global Mongoose schema normalization plugin
  if (app.mongoose) {
    app.mongoose.plugin(normalizePlugin as any);
  }

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
