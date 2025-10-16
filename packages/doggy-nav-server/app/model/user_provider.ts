export default function(app: any) {
  const { mongoose } = app;
  const { Schema } = mongoose;

  const UserProviderSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: [ 'github', 'google', 'linuxdo' ],
      required: true,
    },
    providerUserId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    profile: {
      type: Schema.Types.Mixed,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }, {
    collection: 'user_provider',
    timestamps: true,
  });

  UserProviderSchema.index({ provider: 1, providerUserId: 1 }, { unique: true });

  return mongoose.model('UserProvider', UserProviderSchema);
}
