import mongoose from 'mongoose';
import categoryModel from '../app/model/category';
import { dateToChromeTime } from './timeUtil';
import { privateCategoryName, globalRootCategoryId } from '../constants';
import mongoCfg from '../config/mongodb';

const mongoUrl = mongoCfg.mongoUrl;

const defaultCategories = [
  {
    name: 'Tech & Dev',
    description: 'Programming, tools, development resources, coding platforms, web development, mobile development, DevOps & infrastructure',
    icon: 'type:emoji_💻',
  },
  {
    name: 'Design',
    description: 'UI/UX design, graphic design, creative tools, photography, video & animation, color palettes, fonts & typography, design inspiration',
    icon: 'type:emoji_🎨',
  },
  {
    name: 'Business',
    description: 'Marketing, finance, entrepreneurship, startup resources, SEO, analytics & data, project management, business news',
    icon: 'type:emoji_💼',
  },
  {
    name: 'Learn',
    description: 'Courses, tutorials, education platforms, online learning, certification, academic research, libraries & references',
    icon: 'type:emoji_📚',
  },
  {
    name: 'Social',
    description: 'Networks, communities, communication tools, social platforms, messaging apps, forums, blog platforms',
    icon: 'type:emoji_👥',
  },
  {
    name: 'Media',
    description: 'Streaming, entertainment, content platforms, gaming, music & audio, movies & TV, books & reading, podcasts',
    icon: 'type:emoji_🎬',
  },
  {
    name: 'Tools',
    description: 'Utilities, software, productivity apps, file management, image/video editors, password managers, browser extensions',
    icon: 'type:emoji_🔧',
  },
  {
    name: 'Shop',
    description: 'E-commerce, marketplaces, deals, online stores, price comparison, coupons, payment services, product reviews',
    icon: 'type:emoji_🛒',
  },
  {
    name: 'Life',
    description: 'Health, travel, lifestyle, personal growth, fitness & exercise, nutrition, mental health, fashion & beauty',
    icon: 'type:emoji_🌟',
  },
  {
    name: 'Science',
    description: 'Research, data, academic resources, scientific journals, data visualization, climate & environment, open data',
    icon: 'type:emoji_🔬',
  },
];


async function initializeCategories() {
  try {
    console.info('🚀 Starting category initialization...');
    console.info('📡 MongoDB URL:', mongoUrl);

    const db = await mongoose.connect(mongoUrl) as any;
    db.mongoose = mongoose;

    const CategorySchema = categoryModel(db);
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(collection => collection.name);

    if (collectionNames.includes('category')) {
      // Check if categories already exist
      const existingCategories = (await CategorySchema.find({})).filter(c => c?.toObject()?.name !== privateCategoryName);
      if (existingCategories.length > 0) {
        console.info(`⚠️  Found ${existingCategories.length} existing categories. Skipping initialization.`);
        console.info('💡 To force re-initialization, please clear the categories collection first.');
        return;
      }
    }

    const currentTime = dateToChromeTime(new Date());

    // Create categories - first-stage categories should have globalRootCategoryId as their parent
    const categoriesToInsert = defaultCategories.map((cat, index) => ({
      name: cat.name,
      categoryId: globalRootCategoryId, // First-stage categories are children of virtual root
      createAt: currentTime + index, // Slightly offset to maintain order
      hide: false,
      icon: cat.icon,
      children: [],
      showInMenu: true,
      description: cat.description,
    }));

    await CategorySchema.insertMany(categoriesToInsert);
    console.info('✅ Successfully initialized categories:');
  } catch (error) {
    console.error('❌ Error initializing categories:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.info('🔌 Database connection closed.');
    process.exit(0);
  }
}

// Self-executing async function
(async () => {
  try {
    await initializeCategories();
  } catch (error) {
    console.error('💥 Fatal error during category initialization:', error);
    process.exit(1);
  }
})();
