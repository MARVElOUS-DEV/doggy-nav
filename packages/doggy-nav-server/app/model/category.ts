import { chromeTimeToDate, dateToChromeTime } from 'doggy-nav-core';

export default function (app: any) {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const CategorySchema = new Schema(
    {
      name: String,
      categoryId: String,
      description: String,
      createAt: Number, // Chrome time number
      // When true, this category acts as a folder only and should not contain its own nav items
      onlyFolder: {
        type: Boolean,
        default: false,
      },
      icon: {
        type: String,
        default: '',
      },
      children: [
        {
          name: String,
          categoryId: String,
          createAt: Number, // Chrome time number
          showInMenu: {
            type: Boolean,
            default: true,
          },
        },
      ],
      showInMenu: {
        type: Boolean,
        default: true,
      },
      audience: {
        visibility: { type: String, enum: ['public', 'authenticated', 'restricted', 'hide'], default: 'public' },
        allowRoles: [{ type: Schema.Types.ObjectId, ref: 'Role', default: [] }],
        allowGroups: [{ type: Schema.Types.ObjectId, ref: 'Group', default: [] }],
      },
    },
    {
      collection: 'category',
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );
  CategorySchema.index({ 'audience.allowRoles': 1 });
  CategorySchema.index({ 'audience.allowGroups': 1 });

  // Virtual getter to convert Chrome time to user-friendly Date
  CategorySchema.virtual('createAtDate').get(function () {
    return chromeTimeToDate(this.createAt);
  });

  // Virtual setter to convert Date to Chrome time
  CategorySchema.virtual('createAtDate').set(function (date: Date) {
    if (date instanceof Date) {
      this.createAt = dateToChromeTime(date);
    }
  });

  // Also add to children array elements
  CategorySchema.virtual('childrenWithDates').get(function () {
    if (this.children && Array.isArray(this.children)) {
      return this.children.map((child) => {
        const childObj = { ...child };
        if (child.createAt && typeof child.createAt === 'number') {
          childObj.createAtDate = chromeTimeToDate(child.createAt);
        }
        return childObj;
      });
    }
    return this.children;
  });
  return mongoose.model('Category', CategorySchema);
}
