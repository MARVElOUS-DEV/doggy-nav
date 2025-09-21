module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const NavSchema = new Schema({
    categoryId: String,
    name: String,
    // 网站url
    href: String,
    desc: String,
    logo: String,
    authorName: String,
    authorUrl: String,
    auditTime: Date,
    createTime: Date,
    tags: {
      type: Array,
      default: [],
    },
    view: {
      type: Number,
      default: 0,
    },
    star: {
      type: Number,
      default: 0,
    },
    status: {
      type: Number,
      default: 0,
    },
    // URL accessibility status
    urlStatus: {
      type: String,
      enum: ['unknown', 'checking', 'accessible', 'inaccessible'],
      default: 'unknown',
    },
    // Last URL check time
    lastUrlCheck: {
      type: Date,
      default: null,
    },
    // Response time in milliseconds
    responseTime: {
      type: Number,
      default: null,
    },
  }, { collection: 'nav' });
  return mongoose.model('Nav', NavSchema);
};
