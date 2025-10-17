export default function(app: any) {
  const mongoose = app.mongoose;
  const { Schema, Types } = mongoose;

  const InviteCodeSchema = new Schema({
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    usageLimit: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    allowedEmailDomain: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    lastUsedBy: {
      type: Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  }, {
    collection: 'invite_code',
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        if (ret._id) {
          ret._id = ret._id.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc: any, ret: any) {
        if (ret._id) {
          ret._id = ret._id.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
  });

  return mongoose.model('InviteCode', InviteCodeSchema);
}
