import mongoose from 'mongoose';
import categoryModel from '../app/model/category';
import navModel from '../app/model/nav';
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

const defaultWebsites = {
  'Tech & Dev': [
    {
      name: 'GitHub',
      href: 'https://github.com',
      desc: 'Platform for version control and collaboration on code projects',
      logo: 'https://github.githubassets.com/favicons/favicon.svg',
    },
    {
      name: 'Stack Overflow',
      href: 'https://stackoverflow.com',
      desc: 'Question and answer site for programmers',
      logo: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png',
    }
  ],
  'Design': [
    {
      name: 'Dribbble',
      href: 'https://dribbble.com',
      desc: 'Showcase and discover the latest work from designers',
      logo: 'https://cdn.dribbble.com/assets/dribbble-ball-192-23ecbdf9874d870d2767376ecf8a3b62f1b97f7f8b6c302ecb727e64d1de23ff.png',
    },
    {
      name: 'Behance',
      href: 'https://www.behance.net',
      desc: 'Showcase and discover creative work',
      logo: 'https://a5.behance.net/2acd323b10e8e8b7d2e4d2a90c93e1af02b6e6e2/img/site/apple-touch-icon-180x180.png',
    }
  ],
  'Business': [
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com',
      desc: 'Professional networking and career development platform',
      logo: 'https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
    },
    {
      name: 'Bloomberg',
      href: 'https://www.bloomberg.com',
      desc: 'Business and financial news, data and analysis',
      logo: 'https://assets.bwbx.io/s3/javelin/public/website/icons/apple-icon-180x180-a40d72455b3a4d6a315c6b72455b3a4d6a315c.png',
    }
  ],
  'Learn': [
    {
      name: 'Coursera',
      href: 'https://www.coursera.org',
      desc: 'Online courses from top universities and companies',
      logo: 'https://d3njjcbhbojbot.cloudfront.net/web/images/favicons/android-chrome-512x512.50a040346ba4.png',
    },
    {
      name: 'Khan Academy',
      href: 'https://www.khanacademy.org',
      desc: 'Free online courses, lessons and practice',
      logo: 'https://cdn.kastatic.org/images/apple-touch-icon-76x76-precomposed.new.png',
    }
  ],
  'Social': [
    {
      name: 'Twitter',
      href: 'https://twitter.com',
      desc: 'Social media platform for microblogging and social networking',
      logo: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc7275.png',
    },
    {
      name: 'Reddit',
      href: 'https://www.reddit.com',
      desc: 'Social news aggregation and discussion website',
      logo: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png',
    }
  ],
  'Media': [
    {
      name: 'YouTube',
      href: 'https://www.youtube.com',
      desc: 'Video sharing and social media platform',
      logo: 'https://www.youtube.com/favicon.ico',
    },
    {
      name: 'Netflix',
      href: 'https://www.netflix.com',
      desc: 'Streaming entertainment service',
      logo: 'https://www.netflix.com/favicon.ico',
    }
  ],
  'Tools': [
    {
      name: 'Google Drive',
      href: 'https://drive.google.com',
      desc: 'Cloud storage and file synchronization service',
      logo: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
    },
    {
      name: 'Slack',
      href: 'https://slack.com',
      desc: 'Collaboration hub and messaging platform for teams',
      logo: 'https://a.slack-edge.com/80588/img/icons/icon_128.png',
    }
  ],
  'Shop': [
    {
      name: 'Amazon',
      href: 'https://www.amazon.com',
      desc: 'Online shopping and e-commerce platform',
      logo: 'https://images-na.ssl-images-amazon.com/images/G/01/Amazon-www/mobile/Amazon_logo_PNG.png',
    },
    {
      name: 'eBay',
      href: 'https://www.ebay.com',
      desc: 'Online auction and shopping website',
      logo: 'https://ebay.rlcdn.com/str/i/ebay-logo-wordmark-2022.svg',
    }
  ],
  'Life': [
    {
      name: 'WebMD',
      href: 'https://www.webmd.com',
      desc: 'Medical information and health news',
      logo: 'https://img.webmd.com/dtmcms/live/webmd/consumer_assets/site_images/layout_elements/webmd_apple_touch_icon.png',
    },
    {
      name: 'TripAdvisor',
      href: 'https://www.tripadvisor.com',
      desc: 'Travel reviews and booking platform',
      logo: 'https://www.tripadvisor.com/img/cdsi/apple-touch-icon-180x180-75be004d1a0a89f1ce6a78768a22d5d4-180.png',
    }
  ],
  'Science': [
    {
      name: 'NASA',
      href: 'https://www.nasa.gov',
      desc: 'Official website of National Aeronautics and Space Administration',
      logo: 'https://www.nasa.gov/wp-content/themes/nasa_theme/images/nasa-logo.svg',
    },
    {
      name: 'PubMed',
      href: 'https://pubmed.ncbi.nlm.nih.gov',
      desc: 'Database of medical literature and research',
      logo: 'https://www.ncbi.nlm.nih.gov/coreutils/nwds/img/favicons/pmc.png',
    }
  ],
};


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
      icon: cat.icon,
      children: [],
      showInMenu: true,
      description: cat.description,
      audience: { visibility: 'public', allowRoles: [], allowGroups: [] },
    }));

    await CategorySchema.insertMany(categoriesToInsert);
    console.info('✅ Successfully initialized categories:');

    // Create default websites for each category
    const NavSchema = navModel(db);

    for (const [categoryName, websites] of Object.entries(defaultWebsites)) {
      // Find the category we just created
      const category = await CategorySchema.findOne({ name: categoryName });
      if (category) {
        const categoryId = category._id.toString();
        const websitesToInsert = websites.map((site, index) => ({
          categoryId: categoryId,
          name: site.name,
          href: site.href,
          desc: site.desc,
          logo: site.logo,
          createTime: currentTime + 1000 + index, // Offset time to avoid conflicts
          tags: [],
          view: 0,
          star: 0,
          status: 0,
          isFavorite: false,
          urlStatus: 'unknown',
          lastUrlCheck: null,
          responseTime: null,
          audience: { visibility: 'public', allowRoles: [], allowGroups: [] },
        }));

        await NavSchema.insertMany(websitesToInsert);
        console.info(`✅ Added ${websites.length} default websites for category: ${categoryName}`);
      }
    }
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
