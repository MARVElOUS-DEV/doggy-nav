import { Service } from 'egg';
import axios from 'axios';

/**
 * URL Accessibility Checker Service
 */
export default class UrlChecker extends Service {

  /**
   * Check URL accessibility
   * @param url - The URL to check
   */
  async checkUrlAccessibility(url: string): Promise<{ status: string; responseTime: number; error?: string }> {
    const startTime = Date.now();

    try {
      const response = await axios.head(url, {
        timeout: 5000, // 5 second timeout
        headers: {
          'User-Agent': 'DoggyNav-UrlChecker/1.0',
        },
      });

      const responseTime = Date.now() - startTime;

      this.logger.debug(`URL check successful for ${url}: ${response.status} (${responseTime}ms)`);

      return {
        status: 'accessible',
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Check if it's a network error or HTTP error
      if (error.response) {
        // HTTP error (4xx, 5xx)
        this.logger.debug(`URL check failed for ${url}: HTTP ${error.response.status} (${responseTime}ms)`);
        return {
          status: 'inaccessible',
          responseTime,
          error: `HTTP ${error.response.status}`,
        };
      } else if (error.request) {
        // Network error (timeout, DNS, etc.)
        this.logger.debug(`URL check failed for ${url}: ${error.message} (${responseTime}ms)`);
        return {
          status: 'inaccessible',
          responseTime,
          error: error.message,
        };
      }
      // Other error
      this.logger.debug(`URL check failed for ${url}: ${error.message} (${responseTime}ms)`);
      return {
        status: 'inaccessible',
        responseTime,
        error: error.message,
      };

    }
  }

  /**
   * Update nav item URL status in database
   * @param navId - The nav item ID
   * @param status - The URL status
   * @param responseTime - Response time in milliseconds
   */
  async updateNavUrlStatus(navId: string, status: string, responseTime: number) {
    const { ctx } = this;

    try {
      await ctx.model.Nav.findByIdAndUpdate(navId, {
        urlStatus: status,
        lastUrlCheck: new Date(),
        responseTime,
      });

      this.logger.info(`Updated URL status for Nav ${navId}: ${status} (${responseTime}ms)`);
    } catch (error) {
      this.logger.error(`Failed to update URL status for Nav ${navId}:`, error);
      throw error;
    }
  }

  /**
   * Check and update URL status for a single nav item
   * @param navItem - The nav item to check
   */
  async checkAndUpdateNavUrl(navItem: any) {
    const { ctx } = this;

    if (!navItem.href) {
      this.logger.warn(`Nav item ${navItem._id} has no URL to check`);
      return;
    }

    try {
      // Mark as checking
      await ctx.model.Nav.findByIdAndUpdate(navItem._id, {
        urlStatus: 'checking',
      });

      const result = await this.checkUrlAccessibility(navItem.href);

      await this.updateNavUrlStatus(navItem._id, result.status, result.responseTime);

      return result;
    } catch (error) {
      this.logger.error(`Error checking URL for Nav ${navItem._id}:`, error);

      // Mark as inaccessible on error
      await ctx.model.Nav.findByIdAndUpdate(navItem._id, {
        urlStatus: 'inaccessible',
        lastUrlCheck: new Date(),
      });

      throw error;
    }
  }

  /**
   * Check URL status for multiple nav items
   * @param navItems - Array of nav items to check
   * @param concurrent - Number of concurrent checks (default: 5)
   */
  async checkMultipleNavUrls(navItems: any[], concurrent = 5) {
    // const { ctx } = this; // Commented out as not used in this method
    const results: any[] = [];

    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < navItems.length; i += concurrent) {
      const batch = navItems.slice(i, i + concurrent);

      const batchPromises = batch.map(async navItem => {
        try {
          const result = await this.checkAndUpdateNavUrl(navItem);
          return { navId: navItem._id, success: true, result };
        } catch (error: any) {
          return { navId: navItem._id, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises.map(async promise => {
        try {
          return await promise;
        } catch (error) {
          return error;
        }
      }));
      results.push(...batchResults);

      // Small delay between batches to be respectful
      if (i + concurrent < navItems.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.logger.info(`Completed URL check for ${navItems.length} nav items`);
    return results;
  }

  /**
   * Get nav items that need URL checking
   * @param maxAge - Maximum age in milliseconds for last check (default: 1 hour)
   * @param limit - Maximum number of items to return (default: 100)
   */
  async getNavItemsForUrlCheck(maxAge: number = 60 * 60 * 1000, limit = 100) {
    const { ctx } = this;
    const cutoffTime = new Date(Date.now() - maxAge);

    const query = {
      $or: [
        { lastUrlCheck: null },
        { lastUrlCheck: { $lt: cutoffTime } },
        { urlStatus: 'unknown' },
      ],
      href: { $exists: true, $nin: [ null, '' ] },
    };

    return ctx.model.Nav.find(query).limit(limit).exec();
  }
}
