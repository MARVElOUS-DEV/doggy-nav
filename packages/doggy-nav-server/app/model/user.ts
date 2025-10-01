export default function(app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const UserSchema = new Schema({
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
      match: [ /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email' ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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
  }, {
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
  });

  return mongoose.model('User', UserSchema);
}
