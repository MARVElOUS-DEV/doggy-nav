export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const SupportPaymentSchema = new Schema(
    {
      _id: { type: Schema.Types.ObjectId, auto: true },
      kind: { type: String, required: true, trim: true, default: 'coffee' },
      tierId: { type: String, required: true, trim: true },
      amount: { type: Number, required: true },
      currency: { type: String, required: true, trim: true, default: 'usd' },
      creatorLabel: { type: String, required: true, trim: true },
      userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
      sourceApp: { type: String, trim: true, default: '' },
      sourcePath: { type: String, trim: true, default: '' },
      sourceHost: { type: String, trim: true, default: '' },
      sourceReferrer: { type: String, trim: true, default: '' },
      stripeCheckoutSessionId: { type: String, required: true, unique: true, index: true },
      stripeCheckoutUrl: { type: String, required: true },
      stripeSessionStatus: { type: String, default: '' },
      stripePaymentStatus: { type: String, default: '' },
      stripeMetadata: { type: Schema.Types.Mixed, default: {} },
    },
    { collection: 'support_payments', timestamps: true }
  );

  SupportPaymentSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? ret.id;
      if (ret.userId?.toString) {
        ret.userId = ret.userId.toString();
      }
      delete ret._id;
    },
  });

  return mongoose.model('SupportPayment', SupportPaymentSchema);
}
