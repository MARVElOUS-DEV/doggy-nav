export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const FavoriteSchema = new Schema(
    {
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
      parentFolderId: {
        type: Schema.Types.ObjectId,
        ref: 'FavoriteFolder',
        default: null,
        index: true,
      },
      order: {
        type: Number,
        default: () => Date.now(),
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
    },
    {
      collection: 'favorite',
      timestamps: true,
      toJSON: {
        virtuals: true,
      },
      toObject: {
        virtuals: true,
      },
    }
  );

  // Create compound index to ensure a user can only favorite a nav item once
  FavoriteSchema.index({ userId: 1, navId: 1 }, { unique: true });
  // Add index for efficient queries by user
  FavoriteSchema.index({ userId: 1, createdAt: -1 });
  FavoriteSchema.index({ userId: 1, parentFolderId: 1 });
  FavoriteSchema.index({ userId: 1, order: 1 });

  return mongoose.model('Favorite', FavoriteSchema);
}
