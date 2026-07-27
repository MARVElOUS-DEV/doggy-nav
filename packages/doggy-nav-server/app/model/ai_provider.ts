export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const AiProviderSchema = new Schema(
    {
      name: { type: String, required: true, trim: true },
      provider: {
        type: String,
        enum: ['openai-compatible', 'mimo'],
        required: true,
        default: 'openai-compatible',
      },
      baseURL: { type: String, required: true, trim: true },
      model: { type: String, required: true, trim: true },
      apiKey: { type: String, required: true },
      active: { type: Boolean, default: false },
    },
    { collection: 'ai_provider', timestamps: true }
  );

  AiProviderSchema.index({ name: 1 }, { unique: true, background: true });
  AiProviderSchema.index({ active: 1 }, { background: true });

  AiProviderSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() || ret._id;
      ret.apiKeySet = Boolean(ret.apiKey);
      delete ret._id;
      delete ret.apiKey;
    },
  });

  return mongoose.model('AiProvider', AiProviderSchema);
}
