export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ToolOutputPublicationSchema = new Schema(
    {
      toolId: { type: String, required: true, trim: true },
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      publishId: { type: String, required: true, unique: true, index: true },
      enabled: { type: Boolean, default: false },
      direction: {
        type: String,
        required: true,
        enum: ['yaml-to-json', 'json-to-yaml'],
      },
      contentType: { type: String, required: true },
      encryptedOutput: { type: String, required: true },
      encryptionIv: { type: String, required: true },
      encryptionTag: { type: String, required: true },
      basicAuthUsername: { type: String, required: true, trim: true },
      basicAuthPasswordHash: { type: String, required: true },
    },
    { collection: 'tool_output_publications', timestamps: true }
  );

  ToolOutputPublicationSchema.index({ userId: 1, toolId: 1 }, { unique: true });

  ToolOutputPublicationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_: any, ret: any) => {
      ret.id = ret._id?.toString?.() ?? ret.id;
      delete ret._id;
      delete ret.encryptedOutput;
      delete ret.encryptionIv;
      delete ret.encryptionTag;
      delete ret.basicAuthPasswordHash;
    },
  });

  return mongoose.model('ToolOutputPublication', ToolOutputPublicationSchema);
}
