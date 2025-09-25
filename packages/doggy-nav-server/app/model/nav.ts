import { chromeTimeToDate, dateToChromeTime } from "../../utils/timeUtil";

export default function(app: any) {
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
    createTime: Number, // Chrome time number
    hide: {
      type: Boolean,
      default: false,
    },
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
      enum: [ 'unknown', 'checking', 'accessible', 'inaccessible' ],
      default: 'unknown',
    },
    // Last URL check time (Chrome time number)
    lastUrlCheck: {
      type: Number,
      default: null,
    },
    // Response time in milliseconds
    responseTime: {
      type: Number,
      default: null,
    },
  }, {
    collection: 'nav',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });

  // Virtual getters to convert Chrome time to user-friendly Date
  NavSchema.virtual('createTimeDate').get(function() {
    return chromeTimeToDate(this.createTime);
  });

  NavSchema.virtual('lastUrlCheckDate').get(function() {
    return chromeTimeToDate(this.lastUrlCheck);
  });

  // Virtual setters to convert Date to Chrome time
  NavSchema.virtual('createTimeDate').set(function(date: Date) {
    if (date instanceof Date) {
      this.createTime = dateToChromeTime(date);
    }
  });

  NavSchema.virtual('lastUrlCheckDate').set(function(date: Date) {
    if (date instanceof Date) {
      this.lastUrlCheck = dateToChromeTime(date);
    }
  });
  return mongoose.model('Nav', NavSchema);
}
