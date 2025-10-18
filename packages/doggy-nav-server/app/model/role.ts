export default function(app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const RoleSchema = new Schema({
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true },
    description: { type: String, default: '' },
    permissions: { type: [ String ], default: [] },
    isSystem: { type: Boolean, default: false },
  }, {
    collection: 'role',
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

  return mongoose.model('Role', RoleSchema);
}
