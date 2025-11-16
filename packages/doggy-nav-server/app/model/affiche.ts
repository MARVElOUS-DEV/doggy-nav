export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const AfficheSchema = new Schema(
    {
      text: { type: String, required: true },
      linkHref: { type: String },
      linkText: { type: String },
      linkTarget: { type: String },
      active: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
    },
    { collection: 'affiche', timestamps: true }
  );

  AfficheSchema.index({ active: 1, order: 1 });

  AfficheSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? ret.id;
      delete ret._id;
    },
  });

  return mongoose.model('Affiche', AfficheSchema);
}
