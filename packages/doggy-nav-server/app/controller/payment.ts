import { URL } from 'url';
import Controller from '../core/base_controller';
import { AppError } from '../core/errors';

export default class PaymentController extends Controller {
  async createCoffeeCheckout() {
    try {
      const body = this.getSanitizedBody();
      const result = await this.ctx.service.payment.createCoffeeCheckout({
        amount: Number(body.amount),
        currency: typeof body.currency === 'string' ? body.currency : null,
        userId: this.ctx.state.userinfo?.userId ? String(this.ctx.state.userinfo.userId) : null,
        sourceApp: this.ctx.get('x-app-source') || '',
        sourcePath: (() => {
          const referer = this.ctx.get('referer');
          if (!referer) return '';
          try {
            return new URL(referer).pathname;
          } catch {
            return '';
          }
        })(),
        sourceHost: this.ctx.get('x-forwarded-host') || this.ctx.host || '',
        sourceReferrer: this.ctx.get('referer') || '',
        forwardedProto: this.ctx.get('x-forwarded-proto') || '',
        forwardedHost: this.ctx.get('x-forwarded-host') || this.ctx.host || '',
      });

      this.success({ url: result.url });
    } catch (error: any) {
      this.ctx.logger.error('Failed to create coffee checkout session:', error);
      this.ctx.status = error instanceof AppError ? error.statusCode : 500;
      this.error(error?.message || 'Unable to start Stripe checkout');
    }
  }
}
