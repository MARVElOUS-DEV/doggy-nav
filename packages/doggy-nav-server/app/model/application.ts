export default function(app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const ApplicationSchema = new Schema({
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    clientSecret: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    allowedOrigins: [{
      type: String,
      trim: true,
    }],
    lastUsedAt: {
      type: Date,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
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
    collection: 'application',
    timestamps: true,
  });

  // Create compound index for efficient queries
  ApplicationSchema.index({ clientSecret: 1, isActive: 1 });

  return mongoose.model('Application', ApplicationSchema);
}
