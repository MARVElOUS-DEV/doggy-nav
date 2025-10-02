export default function(app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const FavoriteSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    navId: {
      type: Schema.Types.ObjectId,
      ref: 'Nav',
      required: true,
      index: true,
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
    collection: 'favorite',
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: any, ret: any) {
        // Convert _id to string
        if (ret._id) {
          ret._id = ret._id.toString();
        }
        // Convert ObjectId references to strings
        if (ret.userId) {
          ret.userId = ret.userId.toString();
        }
        if (ret.navId) {
          ret.navId = ret.navId.toString();
        }
        // Remove __v field
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_doc: any, ret: any) {
        // Convert _id to string
        if (ret._id) {
          ret._id = ret._id.toString();
        }
        // Convert ObjectId references to strings
        if (ret.userId) {
          ret.userId = ret.userId.toString();
        }
        if (ret.navId) {
          ret.navId = ret.navId.toString();
        }
        // Remove __v field
        delete ret.__v;
        return ret;
      },
    },
  });

  // Create compound index to ensure a user can only favorite a nav item once
  FavoriteSchema.index({ userId: 1, navId: 1 }, { unique: true });

  // Add index for efficient queries by user
  FavoriteSchema.index({ userId: 1, createdAt: -1 });

  return mongoose.model('Favorite', FavoriteSchema);
}
