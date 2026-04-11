import Controller from '../core/base_controller';
import { Inject } from '../core/inject';
import { TOKENS } from '../core/ioc';
import {
  buildBasicAuthChallengeHeader,
  isHttpsLikeRequest,
  parseBasicAuthHeader,
  type ToolOutputPublicationService,
} from 'doggy-nav-core';

export default class ToolOutputPublicationController extends Controller {
  @Inject(TOKENS.ToolOutputPublicationService)
  private toolOutputPublicationService!: ToolOutputPublicationService;

  private getAuthenticatedUserId(): string | null {
    return this.ctx.state.userinfo?.userId ? String(this.ctx.state.userinfo.userId) : null;
  }

  private sendBasicAuthChallenge() {
    this.ctx.set('WWW-Authenticate', buildBasicAuthChallengeHeader());
  }

  private isHttpsRequest(): boolean {
    return isHttpsLikeRequest({
      secure: this.ctx.secure,
      forwardedProto: this.ctx.get('x-forwarded-proto'),
    });
  }

  async getCurrent() {
    const userId = this.getAuthenticatedUserId();
    if (!userId) {
      this.ctx.status = 401;
      this.error('用户未认证');
      return;
    }

    const result = await this.toolOutputPublicationService.getForUser(userId);
    this.success(result);
  }

  async upsert() {
    const userId = this.getAuthenticatedUserId();
    if (!userId) {
      this.ctx.status = 401;
      this.error('用户未认证');
      return;
    }

    try {
      const body = this.getSanitizedBody();
      const result = await this.toolOutputPublicationService.saveForUser(userId, {
        enabled: !!body.enabled,
        direction: body.direction,
        contentType: String(body.contentType || ''),
        output: String(body.output || ''),
        basicAuthUsername: String(body.basicAuthUsername || ''),
        basicAuthPassword:
          body.basicAuthPassword !== undefined ? String(body.basicAuthPassword || '') : undefined,
      });
      this.success(result);
    } catch (error: any) {
      this.ctx.logger.error('Failed to save tool output publication:', error);
      this.error(error?.message || '保存发布配置失败');
    }
  }

  async remove() {
    const userId = this.getAuthenticatedUserId();
    if (!userId) {
      this.ctx.status = 401;
      this.error('用户未认证');
      return;
    }

    const result = await this.toolOutputPublicationService.deleteForUser(userId);
    this.success(result);
  }

  async published() {
    if (this.ctx.app.config.toolOutput?.requireHttps !== false && process.env.NODE_ENV === 'production') {
      if (!this.isHttpsRequest()) {
        this.ctx.status = 400;
        this.ctx.body = 'HTTPS is required';
        return;
      }
    }

    const auth = parseBasicAuthHeader(this.ctx.get('authorization'));
    if (!auth) {
      this.sendBasicAuthChallenge();
      this.ctx.status = 401;
      this.ctx.body = 'Authentication required';
      return;
    }

    const { publishId } = this.ctx.params;
    const result = await this.toolOutputPublicationService.readPublished(
      String(publishId || ''),
      auth.username,
      auth.password
    );

    if (result.kind === 'not_found') {
      this.ctx.status = 404;
      this.ctx.body = 'Not Found';
      return;
    }
    if (result.kind === 'unauthorized') {
      this.sendBasicAuthChallenge();
      this.ctx.status = 401;
      this.ctx.body = 'Invalid credentials';
      return;
    }

    this.ctx.set('Content-Type', result.data.contentType);
    this.ctx.set('Cache-Control', 'no-store');
    this.ctx.status = 200;
    this.ctx.body = result.data.output;
  }
}
