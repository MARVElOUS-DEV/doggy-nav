import { Service } from 'egg';
import Stripe from 'stripe';
import { AppError, ValidationError } from '../core/errors';
import { TOKENS } from '../core/ioc';
import {
  DEFAULT_SUPPORT_CREATOR_LABEL,
  resolveSupportPaymentCurrency,
  resolveSupportPaymentSettings,
  resolveSupportPaymentTier,
  SUPPORT_PAYMENT_KIND,
  type SiteSettingsService,
} from 'doggy-nav-core';

interface CreateCoffeeCheckoutInput {
  amount: number;
  currency?: string | null;
  userId?: string | null;
  sourceApp?: string | null;
  sourcePath?: string | null;
  sourceHost?: string | null;
  sourceReferrer?: string | null;
  forwardedProto?: string | null;
  forwardedHost?: string | null;
}

export default class PaymentService extends Service {
  private stripeClient: InstanceType<typeof Stripe> | null = null;

  private getStripeClient() {
    if (this.stripeClient) return this.stripeClient;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new AppError('Stripe is not configured yet. Add STRIPE_SECRET_KEY first.', 503);
    }

    this.stripeClient = new Stripe(secretKey);
    return this.stripeClient;
  }

  private resolveCreatorLabel() {
    return process.env.STRIPE_SUPPORT_CREATOR_NAME?.trim() || DEFAULT_SUPPORT_CREATOR_LABEL;
  }

  private async getSiteSettings() {
    const siteSettingsService = this.ctx.di?.resolve(TOKENS.SiteSettingsService) as
      | SiteSettingsService
      | undefined;
    if (!siteSettingsService) {
      return null;
    }

    return siteSettingsService.get();
  }

  private resolveOrigin(
    input: Pick<CreateCoffeeCheckoutInput, 'forwardedHost' | 'forwardedProto'>
  ) {
    const explicitBase =
      process.env.STRIPE_SUPPORT_BASE_URL?.trim() || process.env.PUBLIC_BASE_URL?.trim();
    if (explicitBase) {
      return explicitBase.replace(/\/$/, '');
    }

    const forwardedHost = input.forwardedHost?.trim();
    if (!forwardedHost) {
      throw new AppError(
        'Unable to resolve the public app URL for Stripe checkout redirects.',
        500
      );
    }

    const proto =
      input.forwardedProto?.trim() || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    return `${proto}://${forwardedHost}`;
  }

  async createCoffeeCheckout(input: CreateCoffeeCheckoutInput) {
    const amount = Number(input.amount);
    const siteSettings = await this.getSiteSettings();
    const supportSettings = resolveSupportPaymentSettings(siteSettings?.supportSettings);
    if (!supportSettings.enabled) {
      throw new ValidationError('Support checkout is not enabled');
    }

    const currency = resolveSupportPaymentCurrency(input.currency, supportSettings.defaultCurrency);
    if (!currency) {
      throw new ValidationError('Unsupported coffee currency');
    }

    const tier = resolveSupportPaymentTier(amount, currency, supportSettings);
    if (!tier) {
      throw new ValidationError('Unsupported coffee amount');
    }

    const stripe = this.getStripeClient();
    const creatorLabel =
      siteSettings?.supportSettings?.creatorLabel?.trim() || this.resolveCreatorLabel();
    const origin = this.resolveOrigin(input);
    const recordId = new this.app.mongoose.Types.ObjectId();
    const successUrl =
      process.env.STRIPE_SUPPORT_SUCCESS_URL?.trim() || `${origin}/desktop?coffee=success`;
    const cancelUrl =
      process.env.STRIPE_SUPPORT_CANCEL_URL?.trim() || `${origin}/desktop?coffee=cancel`;

    const metadata = {
      supportKind: SUPPORT_PAYMENT_KIND,
      supportTierId: tier.id,
      supportAmount: String(tier.amount),
      supportCurrency: currency,
      supportRecordId: recordId.toString(),
      creatorLabel,
      userId: input.userId || '',
      sourceApp: input.sourceApp || '',
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: recordId.toString(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: tier.amount,
            product_data: {
              name: `Buy ${creatorLabel} a coffee`,
              description: tier.description,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    });

    if (!session.url) {
      throw new AppError('Stripe did not return a checkout URL', 502);
    }

    const SupportPayment = (this.ctx.model as any).SupportPayment;
    const record = await SupportPayment.create({
      _id: recordId,
      kind: SUPPORT_PAYMENT_KIND,
      tierId: tier.id,
      amount: tier.amount,
      currency,
      creatorLabel,
      userId: input.userId || null,
      sourceApp: input.sourceApp || '',
      sourcePath: input.sourcePath || '',
      sourceHost: input.sourceHost || '',
      sourceReferrer: input.sourceReferrer || '',
      stripeCheckoutSessionId: session.id,
      stripeCheckoutUrl: session.url,
      stripeSessionStatus: session.status || '',
      stripePaymentStatus: session.payment_status || '',
      stripeMetadata: metadata,
    });

    return {
      url: session.url,
      record,
    };
  }
}
