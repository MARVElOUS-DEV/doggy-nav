export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const PromptSchema = new Schema(
    {
      code: { type: String, default: 'global.default', index: true },
      name: { type: String, required: true },
      content: { type: String, required: true },
      active: { type: Boolean, default: false },
    },
    { collection: 'prompt', timestamps: true }
  );

  PromptSchema.index({ name: 1 }, { unique: true, background: true });
  PromptSchema.index({ code: 1, active: 1 }, { background: true });

  // Hide __v and map _id -> id via toJSON
  PromptSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() || ret._id;
      delete ret._id;
    },
  });

  return mongoose.model('Prompt', PromptSchema);
}
