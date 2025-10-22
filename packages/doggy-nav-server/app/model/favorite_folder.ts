export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const FavoriteFolderSchema = new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      order: {
        type: Number,
        default: () => Date.now(),
        index: true,
      },
      coverNavId: {
        type: Schema.Types.ObjectId,
        ref: 'Nav',
        default: null,
      },
    },
    {
      collection: 'favorite_folder',
      timestamps: true,
      toJSON: {
        virtuals: true,
      },
      toObject: {
        virtuals: true,
      },
    }
  );

  FavoriteFolderSchema.index({ userId: 1, order: 1 });
  FavoriteFolderSchema.index({ userId: 1, name: 1 });

  return mongoose.model('FavoriteFolder', FavoriteFolderSchema);
}
