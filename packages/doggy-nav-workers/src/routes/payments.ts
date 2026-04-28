import { Hono } from 'hono';
import Stripe from 'stripe';
import {
  resolveSupportPaymentCurrency,
  resolveSupportPaymentSettings,
  resolveSupportPaymentTier,
  SUPPORT_PAYMENT_KIND,
  type SiteSettingsService,
} from 'doggy-nav-core';
import D1SupportPaymentRepository from '../adapters/d1SupportPaymentRepository';
import { getDI, getUser } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';
import { responses } from '../utils/responses';
import { newId24 } from '../utils/id';

type Env = {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_SUPPORT_BASE_URL?: string;
  STRIPE_SUPPORT_SUCCESS_URL?: string;
  STRIPE_SUPPORT_CANCEL_URL?: string;
  STRIPE_SUPPORT_CREATOR_NAME?: string;
  NODE_ENV?: string;
};

const paymentRoutes = new Hono<{ Bindings: Env }>();

function resolveOrigin(c: any) {
  const explicitBase = c.env.STRIPE_SUPPORT_BASE_URL?.trim();
  if (explicitBase) {
    return explicitBase.replace(/\/$/, '');
  }

  const forwardedHost = c.req.header('x-forwarded-host') || new URL(c.req.url).host;
  if (!forwardedHost) {
    throw new Error('Unable to resolve request host');
  }

  const forwardedProto =
    c.req.header('x-forwarded-proto') || (c.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${forwardedProto}://${forwardedHost}`;
}

paymentRoutes.post('/coffee/checkout', async (c) => {
  try {
    const secretKey = c.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return c.json(
        {
          code: 503,
          msg: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY first.',
          data: null,
        },
        503
      );
    }

    const body = await c.req.json();
    const amount = Number(body?.amount);
    const siteSettingsService = getDI(c).resolve(TOKENS.SiteSettingsService) as SiteSettingsService;
    const siteSettings = await siteSettingsService.get();
    const supportSettings = resolveSupportPaymentSettings(siteSettings?.supportSettings);
    if (!supportSettings.enabled) {
      return c.json(responses.badRequest('Support checkout is not enabled'), 400);
    }

    const currency = resolveSupportPaymentCurrency(body?.currency, supportSettings.defaultCurrency);
    if (!currency) {
      return c.json(responses.badRequest('Unsupported coffee currency'), 400);
    }

    const tier = resolveSupportPaymentTier(amount, currency, supportSettings);
    if (!tier) {
      return c.json(responses.badRequest('Unsupported coffee amount'), 400);
    }

    const recordId = newId24();
    const creatorLabel =
      siteSettings?.supportSettings?.creatorLabel?.trim() ||
      c.env.STRIPE_SUPPORT_CREATOR_NAME?.trim() ||
      supportSettings.creatorLabel;
    const origin = resolveOrigin(c);
    const successUrl =
      c.env.STRIPE_SUPPORT_SUCCESS_URL?.trim() || `${origin}/desktop?coffee=success`;
    const cancelUrl = c.env.STRIPE_SUPPORT_CANCEL_URL?.trim() || `${origin}/desktop?coffee=cancel`;
    const user = getUser(c);
    const metadata = {
      supportKind: SUPPORT_PAYMENT_KIND,
      supportTierId: tier.id,
      supportAmount: String(tier.amount),
      supportCurrency: currency,
      supportRecordId: recordId,
      creatorLabel,
      userId: user?.id || '',
      sourceApp: c.req.header('x-app-source') || '',
    };

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: recordId,
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
      return c.json({ code: 502, msg: 'Stripe did not return a checkout URL', data: null }, 502);
    }

    const repo = new D1SupportPaymentRepository(c.env.DB);
    const referer = c.req.header('referer') || '';
    let sourcePath = '';
    if (referer) {
      try {
        sourcePath = new URL(referer).pathname;
      } catch {}
    }

    await repo.create({
      id: recordId,
      kind: SUPPORT_PAYMENT_KIND,
      tierId: tier.id,
      amount: tier.amount,
      currency,
      creatorLabel,
      userId: user?.id || null,
      sourceApp: c.req.header('x-app-source') || '',
      sourcePath,
      sourceHost: c.req.header('x-forwarded-host') || new URL(c.req.url).host || '',
      sourceReferrer: referer,
      stripeCheckoutSessionId: session.id,
      stripeCheckoutUrl: session.url,
      stripeSessionStatus: session.status || '',
      stripePaymentStatus: session.payment_status || '',
      stripeMetadata: metadata,
    });

    return c.json(responses.ok({ url: session.url }));
  } catch (error: any) {
    console.error('Worker coffee checkout error:', error);
    return c.json(
      { code: 500, msg: error?.message || 'Unable to start Stripe checkout', data: null },
      500
    );
  }
});

export default paymentRoutes;
