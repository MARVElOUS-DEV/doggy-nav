export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const UserSchema = new Schema(
    {
      username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      },
      password: {
        type: String,
        required: true,
        minlength: 6,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      nickName: {
        type: String,
        default: '',
        trim: true,
      },
      phone: {
        type: String,
        default: '',
        trim: true,
      },
      roles: [{ type: Schema.Types.ObjectId, ref: 'Role', default: [] }],
      groups: [{ type: Schema.Types.ObjectId, ref: 'Group', default: [] }],
      extraPermissions: { type: [String], default: [] },
      lastLoginAt: {
        type: Date,
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
      resetPasswordToken: {
        type: String,
        default: null,
      },
      resetPasswordExpires: {
        type: Date,
        default: null,
      },
      avatar: {
        type: String,
        default: null,
      },
    },
    {
      collection: 'user',
      timestamps: true,
      toJSON: {
        transform(_doc: any, ret: any) {
          // Convert _id to string
          if (ret._id) {
            ret._id = ret._id.toString();
          }
          // Remove sensitive fields and __v
          delete ret.password;
          delete ret.resetPasswordToken;
          delete ret.__v;
          return ret;
        },
      },
      toObject: {
        transform(_doc: any, ret: any) {
          // Convert _id to string
          if (ret._id) {
            ret._id = ret._id.toString();
          }
          // Remove sensitive fields and __v
          delete ret.password;
          delete ret.resetPasswordToken;
          delete ret.__v;
          return ret;
        },
      },
    }
  );

  UserSchema.index({ roles: 1 });
  UserSchema.index({ groups: 1 });

  return mongoose.model('User', UserSchema);
}
