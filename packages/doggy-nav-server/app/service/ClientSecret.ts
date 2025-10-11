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
      const application = await ctx.model.Application.findOne({
        clientSecret,
        isActive: true,
      });
      return !!application;
    } catch (error: any) {
      this.logger.error('Error verifying client secret:', error);
      return false;
    }
  }

  async createApplication(name: string, description?: string, allowedOrigins?: string[]): Promise<any> {
    const { ctx } = this;
    try {
      const clientSecret = this.generateClientSecret();
      const application = await ctx.model.Application.create({
        name,
        description,
        clientSecret,
        allowedOrigins: allowedOrigins || [],
        isActive: true,
      });
      return application;
    } catch (error: any) {
      this.logger.error('Error creating application:', error);
      throw new Error('Failed to create application');
    }
  }

  async regenerateClientSecret(applicationId: string): Promise<string> {
    const { ctx } = this;
    try {
      const clientSecret = this.generateClientSecret();
      await ctx.model.Application.findByIdAndUpdate(applicationId, {
        clientSecret,
        updatedAt: new Date(),
      });
      return clientSecret;
    } catch (error: any) {
      this.logger.error('Error regenerating client secret:', error);
      throw new Error('Failed to regenerate client secret');
    }
  }

  async revokeApplication(applicationId: string): Promise<boolean> {
    const { ctx } = this;
    try {
      await ctx.model.Application.findByIdAndUpdate(applicationId, {
        isActive: false,
        updatedAt: new Date(),
      });
      return true;
    } catch (error: any) {
      this.logger.error('Error revoking application:', error);
      return false;
    }
  }

  async getAllApplications(page: number = 1, limit: number = 10): Promise<{ applications: any[], total: number }> {
    const { ctx } = this;
    try {
      const skip = (page - 1) * limit;
      const [ applications, total ] = await Promise.all([
        ctx.model.Application.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        ctx.model.Application.countDocuments(),
      ]);
      return { applications, total };
    } catch (error: any) {
      this.logger.error('Error getting all applications:', error);
      return { applications: [], total: 0 };
    }
  }

  async updateApplication(applicationId: string, updates: any): Promise<any> {
    const { ctx } = this;
    try {
      return await ctx.model.Application.findByIdAndUpdate(
        applicationId,
        { ...updates, updatedAt: new Date() },
        { new: true },
      );
    } catch (error: any) {
      this.logger.error('Error updating application:', error);
      throw new Error('Failed to update application');
    }
  }

  validateClientSecretFormat(clientSecret: string): boolean {
    return typeof clientSecret === 'string' &&
    clientSecret.length === 64 &&
    /^[a-f0-9]+$/.test(clientSecret);
  }

  async getApplicationById(applicationId: string): Promise<any> {
    const { ctx } = this;
    try {
      return await ctx.model.Application.findById(applicationId);
    } catch (error: any) {
      this.logger.error('Error getting application by ID:', error);
      return null;
    }
  }

  async getApplicationByClientSecret(clientSecret: string): Promise<any> {
    const { ctx } = this;
    try {
      return await ctx.model.Application.findOne({
        clientSecret,
        isActive: true,
      });
    } catch (error: any) {
      this.logger.error('Error getting application by client secret:', error);
      return null;
    }
  }
}
