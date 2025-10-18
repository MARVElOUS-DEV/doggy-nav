export default function(app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const GroupSchema = new Schema({
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true },
    description: { type: String, default: '' },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  }, {
    collection: 'group',
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        if (ret._id) ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc: any, ret: any) {
        if (ret._id) ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  });

  return mongoose.model('Group', GroupSchema);
}
