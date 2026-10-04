export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const RefreshSessionSchema = new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      source: { type: String, enum: ['main', 'admin'], required: true },
      currentTokenHash: { type: String, required: true },
      previousTokenHash: { type: String, default: null },
      rotatedAt: { type: Date, default: null },
      expiresAt: { type: Date, required: true },
      revokedAt: { type: Date, default: null },
    },
    {
      collection: 'refresh_session',
      timestamps: true,
    }
  );

  RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  RefreshSessionSchema.index({ userId: 1, revokedAt: 1 });

  return mongoose.model('RefreshSession', RefreshSessionSchema);
}
