export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const SiteSettingsSchema = new Schema(
    {
      singletonKey: { type: String, required: true, default: 'default', unique: true },
      siteTitle: { type: String, default: null },
      logoUrl: { type: String, default: null },
      seoTitle: { type: String, default: null },
      seoDescription: { type: String, default: null },
      seoKeywords: [{ type: String }],
      copyrightText: { type: String, default: null },
      feedbackUrl: { type: String, default: null },
    },
    { collection: 'site_settings', timestamps: true }
  );

  SiteSettingsSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? ret.id;
      delete ret._id;
    },
  });

  return mongoose.model('SiteSettings', SiteSettingsSchema);
}
