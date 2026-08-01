import Controller from '../core/base_controller';
import { Inject } from '../core/inject';
import { TOKENS } from '../core/ioc';
import {
  isHttpsLikeRequest,
  parsePublishedToolOutputToken,
  TOOL_OUTPUT_PUBLICATION_TOKEN_QUERY_PARAM,
  type ToolOutputPublicationService,
} from 'doggy-nav-core';

export default class ToolOutputPublicationController extends Controller {
  @Inject(TOKENS.ToolOutputPublicationService)
  private toolOutputPublicationService!: ToolOutputPublicationService;

  private getAuthenticatedUserId(): string | null {
    return this.ctx.state.userinfo?.userId ? String(this.ctx.state.userinfo.userId) : null;
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

    const result = await this.toolOutputPublicationService.listForUser(userId);
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
        publishId: body.publishId,
        enabled: !!body.enabled,
        direction: body.direction,
        contentType: String(body.contentType || ''),
        output: String(body.output || ''),
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

    const result = await this.toolOutputPublicationService.deleteForUser(
      userId,
      String(this.ctx.query.publishId || '')
    );
    this.success(result);
  }

  async rotateToken() {
    const userId = this.getAuthenticatedUserId();
    if (!userId) {
      this.ctx.status = 401;
      this.error('用户未认证');
      return;
    }

    try {
      const result = await this.toolOutputPublicationService.rotateTokenForUser(
        userId,
        String(this.getSanitizedBody().publishId || '')
      );
      this.success(result);
    } catch (error: any) {
      this.ctx.status = 404;
      this.error(error?.message || '发布配置不存在');
    }
  }

  async published() {
    if (
      this.ctx.app.config.toolOutput?.requireHttps !== false &&
      process.env.NODE_ENV === 'production'
    ) {
      if (!this.isHttpsRequest()) {
        this.ctx.status = 400;
        this.ctx.body = 'HTTPS is required';
        return;
      }
    }

    const token = parsePublishedToolOutputToken(
      this.ctx.query?.[TOOL_OUTPUT_PUBLICATION_TOKEN_QUERY_PARAM]
    );
    if (!token) {
      this.ctx.status = 401;
      this.ctx.body = 'Subscription token required';
      return;
    }

    const { publishId } = this.ctx.params;
    const result = await this.toolOutputPublicationService.readPublished(
      String(publishId || ''),
      token
    );

    if (result.kind === 'not_found') {
      this.ctx.status = 404;
      this.ctx.body = 'Not Found';
      return;
    }
    if (result.kind === 'unauthorized') {
      this.ctx.status = 401;
      this.ctx.body = 'Invalid subscription token';
      return;
    }

    this.ctx.set('Content-Type', result.data.contentType);
    this.ctx.set('Cache-Control', 'no-store');
    this.ctx.status = 200;
    this.ctx.body = result.data.output;
  }
}
