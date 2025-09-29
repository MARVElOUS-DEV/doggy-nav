import mongoose from 'mongoose';
import categoryModel from '../app/model/category';
import { dateToChromeTime } from './timeUtil';
import { privateCategoryName } from '../constants';

const mongoUrl = `mongodb://${process.env.MONGO_URL || '127.0.0.1:27017'}/navigation`;

const defaultCategories = [
  {
    name: 'Tech & Dev',
    description: 'Programming, tools, development resources, coding platforms, web development, mobile development, DevOps & infrastructure',
    icon: '💻',
  },
  {
    name: 'Design',
    description: 'UI/UX design, graphic design, creative tools, photography, video & animation, color palettes, fonts & typography, design inspiration',
    icon: '🎨',
  },
  {
    name: 'Business',
    description: 'Marketing, finance, entrepreneurship, startup resources, SEO, analytics & data, project management, business news',
    icon: '💼',
  },
  {
    name: 'Learn',
    description: 'Courses, tutorials, education platforms, online learning, certification, academic research, libraries & references',
    icon: '📚',
  },
  {
    name: 'Social',
    description: 'Networks, communities, communication tools, social platforms, messaging apps, forums, blog platforms',
    icon: '👥',
  },
  {
    name: 'Media',
    description: 'Streaming, entertainment, content platforms, gaming, music & audio, movies & TV, books & reading, podcasts',
    icon: '🎬',
  },
  {
    name: 'Tools',
    description: 'Utilities, software, productivity apps, file management, image/video editors, password managers, browser extensions',
    icon: '🔧',
  },
  {
    name: 'Shop',
    description: 'E-commerce, marketplaces, deals, online stores, price comparison, coupons, payment services, product reviews',
    icon: '🛒',
  },
  {
    name: 'Life',
    description: 'Health, travel, lifestyle, personal growth, fitness & exercise, nutrition, mental health, fashion & beauty',
    icon: '🌟',
  },
  {
    name: 'Science',
    description: 'Research, data, academic resources, scientific journals, data visualization, climate & environment, open data',
    icon: '🔬',
  },
];

const generateCategoryId = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

async function initializeCategories() {
  try {
    console.info('🚀 Starting category initialization...');
    console.info('📡 MongoDB URL:', mongoUrl);

    const db = mongoose.connect(mongoUrl) as any;
    db.mongoose = mongoose;

    const CategorySchema = categoryModel(db);

    // Check if categories already exist
    const existingCategories = (await CategorySchema.find({})).filter(c => c?.toObject()?.name !== privateCategoryName);
    if (existingCategories.length > 0) {
      console.info(`⚠️  Found ${existingCategories.length} existing categories. Skipping initialization.`);
      console.info('💡 To force re-initialization, please clear the categories collection first.');
      return;
    }

    const currentTime = dateToChromeTime(new Date());

    // Create categories
    const categoriesToInsert = defaultCategories.map((cat, index) => ({
      name: cat.name,
      categoryId: generateCategoryId(cat.name),
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
