interface CreateSupportPaymentInput {
  id: string;
  kind: string;
  tierId: string;
  amount: number;
  currency: string;
  creatorLabel: string;
  userId: string | null;
  sourceApp: string;
  sourcePath: string;
  sourceHost: string;
  sourceReferrer: string;
  stripeCheckoutSessionId: string;
  stripeCheckoutUrl: string;
  stripeSessionStatus: string;
  stripePaymentStatus: string;
  stripeMetadata: Record<string, string>;
}

export default class D1SupportPaymentRepository {
  constructor(private readonly db: D1Database) {}

  async create(input: CreateSupportPaymentInput) {
    await this.db
      .prepare(
        `INSERT INTO support_payments (
          id, kind, tier_id, amount, currency, creator_label, user_id,
          source_app, source_path, source_host, source_referrer,
          stripe_checkout_session_id, stripe_checkout_url, stripe_session_status,
          stripe_payment_status, stripe_metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        input.id,
        input.kind,
        input.tierId,
        input.amount,
        input.currency,
        input.creatorLabel,
        input.userId,
        input.sourceApp,
        input.sourcePath,
        input.sourceHost,
        input.sourceReferrer,
        input.stripeCheckoutSessionId,
        input.stripeCheckoutUrl,
        input.stripeSessionStatus,
        input.stripePaymentStatus,
        JSON.stringify(input.stripeMetadata)
      )
      .run();
  }
}
