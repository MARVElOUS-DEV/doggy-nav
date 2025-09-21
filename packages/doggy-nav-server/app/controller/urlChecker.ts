import BaseController from '../core/base_controller';

export default class UrlCheckerController extends BaseController {

  /**
   * Get URL checker status
   * GET /api/url-checker/status
   */
  async status() {
    const { ctx } = this;

    try {
      const status = ctx.service.urlCheckerTimer.getStatus();
      const stats = await ctx.service.urlCheckerTimer.getCheckStatistics();

      this.success({
        status,
        statistics: stats,
      });
    } catch (error) {
      this.logger.error('Error getting URL checker status:', error);
      this.error('Failed to get URL checker status');
    }
  }

  /**
   * Start URL checker
   * POST /api/url-checker/start
   */
  async start() {
    const { ctx } = this;

    try {
      await ctx.service.urlCheckerTimer.start();
      this.success({ message: 'URL checker started successfully' });
    } catch (error) {
      this.logger.error('Error starting URL checker:', error);
      this.error('Failed to start URL checker');
    }
  }

  /**
   * Stop URL checker
   * POST /api/url-checker/stop
   */
  async stop() {
    const { ctx } = this;

    try {
      ctx.service.urlCheckerTimer.stop();
      this.success({ message: 'URL checker stopped successfully' });
    } catch (error) {
      this.logger.error('Error stopping URL checker:', error);
      this.error('Failed to stop URL checker');
    }
  }

  /**
   * Restart URL checker
   * POST /api/url-checker/restart
   */
  async restart() {
    const { ctx } = this;

    try {
      await ctx.service.urlCheckerTimer.restart();
      this.success({ message: 'URL checker restarted successfully' });
    } catch (error) {
      this.logger.error('Error restarting URL checker:', error);
      this.error('Failed to restart URL checker');
    }
  }

  /**
   * Update URL checker configuration
   * PUT /api/url-checker/config
   */
  async updateConfig() {
    const { ctx } = this;

    try {
      const {
        enabled,
        cronExpression,
        maxCheckAge,
        concurrentChecks,
        batchSize,
        requestTimeout,
        autoStart,
      } = ctx.request.body;

      const config: any = {};

      if (typeof enabled === 'boolean') config.enabled = enabled;
      if (typeof cronExpression === 'string') config.cronExpression = cronExpression;
      if (typeof maxCheckAge === 'number') config.maxCheckAge = maxCheckAge;
      if (typeof concurrentChecks === 'number') config.concurrentChecks = concurrentChecks;
      if (typeof batchSize === 'number') config.batchSize = batchSize;
      if (typeof requestTimeout === 'number') config.requestTimeout = requestTimeout;
      if (typeof autoStart === 'boolean') config.autoStart = autoStart;

      await ctx.service.urlCheckerTimer.updateConfiguration(config);

      this.success({
        message: 'URL checker configuration updated successfully',
        config: ctx.service.urlCheckerTimer.getStatus(),
      });
    } catch (error) {
      this.logger.error('Error updating URL checker configuration:', error);
      this.error('Failed to update URL checker configuration');
    }
  }

  /**
   * Trigger manual URL check
   * POST /api/url-checker/check
   */
  async triggerCheck() {
    const { ctx } = this;

    try {
      const result = await ctx.service.urlCheckerTimer.triggerManualCheck();
      this.success(result);
    } catch (error) {
      this.logger.error('Error triggering manual URL check:', error);
      this.error('Failed to trigger manual URL check');
    }
  }

  /**
   * Check specific nav item URL
   * POST /api/url-checker/check/:id
   */
  async checkNavItem() {
    const { ctx } = this;

    try {
      const { id } = ctx.params;

      const navItem = await ctx.model.Nav.findById(id);
      if (!navItem) {
        return this.error('Nav item not found');
      }

      if (!navItem.href) {
        return this.error('Nav item has no URL to check');
      }

      const result = await ctx.service.urlChecker.checkAndUpdateNavUrl(navItem);

      this.success({
        navId: id,
        url: navItem.href,
        result,
      });
    } catch (error) {
      this.logger.error('Error checking nav item URL:', error);
      this.error('Failed to check nav item URL');
    }
  }

  /**
   * Get URL status for nav items
   * GET /api/url-checker/nav-status
   */
  async getNavUrlStatus() {
    const { ctx } = this;

    try {
      const { page = 1, limit = 20, status } = ctx.query;

      const query: any = {};
      if (status) {
        query.urlStatus = status;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [navItems, total] = await Promise.all([
        ctx.model.Nav.find(query)
          .select('name href urlStatus lastUrlCheck responseTime')
          .skip(skip)
          .limit(limitNum)
          .sort({ lastUrlCheck: -1 }),
        ctx.model.Nav.countDocuments(query),
      ]);

      this.success({
        data: navItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      this.logger.error('Error getting nav URL status:', error);
      this.error('Failed to get nav URL status');
    }
  }
}