import { Application } from 'egg';

export default (app: Application) => {
  // Application lifecycle hooks
  app.beforeStart(async () => {
    app.logger.info('Application is starting...');
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