export default function(app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const FavoriteFolderSchema = new Schema({
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
  }, {
    collection: 'favorite_folder',
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc: any, ret: any) {
        if (ret._id) ret._id = ret._id.toString();
        if (ret.userId) ret.userId = ret.userId.toString();
        if (ret.coverNavId) ret.coverNavId = ret.coverNavId.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_doc: any, ret: any) {
        if (ret._id) ret._id = ret._id.toString();
        if (ret.userId) ret.userId = ret.userId.toString();
        if (ret.coverNavId) ret.coverNavId = ret.coverNavId.toString();
        delete ret.__v;
        return ret;
      },
    },
  });

  FavoriteFolderSchema.index({ userId: 1, order: 1 });
  FavoriteFolderSchema.index({ userId: 1, name: 1 });

  return mongoose.model('FavoriteFolder', FavoriteFolderSchema);
}
