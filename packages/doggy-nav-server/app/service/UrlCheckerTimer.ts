import { Service } from 'egg';
import * as cron from 'node-cron';

/**
 * URL Checker Timer Service
 * Handles scheduled URL accessibility checking
 */
export default class UrlCheckerTimer extends Service {

  private cronJob?: cron.ScheduledTask;
  private isRunning = false;

  /**
   * Start the URL checker timer
   */
  async start() {
    const { app, config, logger } = this;

    if (!config.urlChecker.enabled) {
      logger.info('URL checker is disabled in configuration');
      return;
    }

    if (this.isRunning) {
      logger.warn('URL checker timer is already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(config.urlChecker.cronExpression)) {
      logger.error(`Invalid cron expression: ${config.urlChecker.cronExpression}`);
      return;
    }

    logger.info(`Starting URL checker timer with cron expression: ${config.urlChecker.cronExpression}`);

    // Run initial check
    await this.performUrlCheck();

    // Schedule recurring checks using cron
    this.cronJob = cron.schedule(config.urlChecker.cronExpression, async () => {
      await this.performUrlCheck();
    });

    this.isRunning = true;
    logger.info('URL checker timer started successfully');
  }

  /**
   * Stop the URL checker timer
   */
  stop() {
    const { logger } = this;

    if (!this.isRunning) {
      logger.warn('URL checker timer is not running');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
    }

    this.isRunning = false;
    logger.info('URL checker timer stopped');
  }

  /**
   * Restart the URL checker timer with new configuration
   */
  async restart() {
    this.stop();
    await this.start();
  }

  /**
   * Get timer status
   */
  getStatus() {
    const { config } = this;
    return {
      isRunning: this.isRunning,
      enabled: config.urlChecker.enabled,
      checkInterval: config.urlChecker.checkInterval,
      maxCheckAge: config.urlChecker.maxCheckAge,
      concurrentChecks: config.urlChecker.concurrentChecks,
      batchSize: config.urlChecker.batchSize,
      requestTimeout: config.urlChecker.requestTimeout,
    };
  }

  /**
   * Update timer configuration and restart if running
   */
  async updateConfiguration(newConfig: Partial<any>) {
    const { config, logger } = this;

    // Validate cron expression if provided
    if (newConfig.cronExpression && !cron.validate(newConfig.cronExpression)) {
      throw new Error(`Invalid cron expression: ${newConfig.cronExpression}`);
    }

    // Update configuration
    Object.assign(config.urlChecker, newConfig);

    logger.info('URL checker configuration updated:', newConfig);

    // Restart timer if it was running
    if (this.isRunning) {
      await this.restart();
    }
  }

  /**
   * Perform URL checking for nav items
   */
  private async performUrlCheck() {
    const { ctx, config, logger } = this;

    try {
      logger.info('Starting scheduled URL check');
      const startTime = Date.now();

      // Get nav items that need checking
      const navItems = await ctx.service.urlChecker.getNavItemsForUrlCheck(
        config.urlChecker.maxCheckAge,
        config.urlChecker.batchSize,
      );

      if (navItems.length === 0) {
        logger.info('No nav items need URL checking at this time');
        return;
      }

      logger.info(`Found ${navItems.length} nav items that need URL checking`);

      // Check URLs
      const results = await ctx.service.urlChecker.checkMultipleNavUrls(
        navItems,
        config.urlChecker.concurrentChecks,
      );

      // Log results summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const duration = Date.now() - startTime;

      logger.info(`URL check completed: ${successful} successful, ${failed} failed (${duration}ms)`);

      // Store check statistics
      await this.saveCheckStatistics({
        timestamp: new Date(),
        totalChecked: navItems.length,
        successful,
        failed,
        duration,
      });

    } catch (error) {
      logger.error('Error during scheduled URL check:', error);
    }
  }

  /**
   * Save URL check statistics for monitoring
   */
  private async saveCheckStatistics(stats: any) {
    const { logger } = this;

    try {
      // You can implement statistics storage here
      // For now, just log the statistics
      logger.info('URL Check Statistics:', stats);

      // Optional: Store in database for monitoring dashboard
      // await ctx.model.UrlCheckStats.create(stats);

    } catch (error) {
      logger.error('Error saving URL check statistics:', error);
    }
  }

  /**
   * Manually trigger URL check for all nav items
   */
  async triggerManualCheck() {
    const { ctx, config, logger } = this;

    try {
      logger.info('Triggering manual URL check for all nav items');

      const navItems = await ctx.model.Nav.find({
        href: { $exists: true, $nin: [ null, '' ] },
      }).exec();

      if (navItems.length === 0) {
        logger.info('No nav items with URLs found');
        return { message: 'No nav items to check' };
      }

      const results = await ctx.service.urlChecker.checkMultipleNavUrls(
        navItems,
        config.urlChecker.concurrentChecks,
      );

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      const summary = {
        totalChecked: navItems.length,
        successful,
        failed,
        results,
      };

      logger.info(`Manual URL check completed: ${successful} successful, ${failed} failed`);

      return summary;

    } catch (error) {
      logger.error('Error during manual URL check:', error);
      throw error;
    }
  }

  /**
   * Get URL check statistics
   */
  async getCheckStatistics() {
    const { ctx } = this;

    try {
      // Get recent statistics from the last 24 hours
      const stats = await ctx.model.Nav.aggregate([
        {
          $group: {
            _id: '$urlStatus',
            count: { $sum: 1 },
          },
        },
      ]);

      const recentChecks = await ctx.model.Nav.aggregate([
        {
          $match: {
            lastUrlCheck: {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$lastUrlCheck' } },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return {
        statusDistribution: stats,
        recentChecksByHour: recentChecks,
      };

    } catch (error) {
      this.logger.error('Error getting URL check statistics:', error);
      throw error;
    }
  }
}
