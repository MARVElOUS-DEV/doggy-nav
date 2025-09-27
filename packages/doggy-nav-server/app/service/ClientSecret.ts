import { Service } from 'egg';
// eslint-disable-next-line no-restricted-imports
import * as crypto from 'crypto';

export default class ClientSecretService extends Service {

  generateClientSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async verifyClientSecret(clientSecret: string): Promise<boolean> {
    const { ctx } = this;
    try {
      const user = await ctx.model.User.findOne({ clientSecret, isActive: true });
      return !!user;
    } catch (error: any) {
      this.logger.error('Error verifying client secret:', error);
      return false;
    }
  }

  async getUserByClientSecret(clientSecret: string) {
    const { ctx } = this;
    try {
      return await ctx.model.User.findOne({
        clientSecret,
        isActive: true,
      }).select('-password');
    } catch (error: any) {
      this.logger.error('Error getting user by client secret:', error);
      return null;
    }
  }

  async generateAndSaveClientSecret(userId: string): Promise<string> {
    const { ctx } = this;
    try {
      const clientSecret = this.generateClientSecret();
      await ctx.model.User.findByIdAndUpdate(userId, {
        clientSecret,
        updatedAt: new Date(),
      });
      return clientSecret;
    } catch (error: any) {
      this.logger.error('Error generating and saving client secret:', error);
      throw new Error('Failed to generate client secret');
    }
  }

  async revokeClientSecret(userId: string): Promise<boolean> {
    const { ctx } = this;
    try {
      await ctx.model.User.findByIdAndUpdate(userId, {
        clientSecret: null,
        updatedAt: new Date(),
      });
      return true;
    } catch (error: any) {
      this.logger.error('Error revoking client secret:', error);
      return false;
    }
  }

  validateClientSecretFormat(clientSecret: string): boolean {
    return typeof clientSecret === 'string' &&
    clientSecret.length === 64 &&
    /^[a-f0-9]+$/.test(clientSecret);
  }
}
