// MongoDB Initialization Script for Doggy Nav
print('🐳 Initializing MongoDB for Doggy Nav...');

// Switch to the doggy_nav database
db = db.getSiblingDB('doggy_nav');

// Create collections with indexes
print('📄 Creating collections...');

// Users collection
db.createCollection('user');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });

// Navigation items collection
db.createCollection('nav');
db.navitems.createIndex({ "name": 1 });
db.navitems.createIndex({ "categoryId": 1 });
db.navitems.createIndex({ "authorId": 1 });
db.navitems.createIndex({ "createdAt": 1 });
db.navitems.createIndex({ "view": -1 });
db.navitems.createIndex({ "star": -1 });

// Categories collection
db.createCollection('category');
db.categories.createIndex({ "name": 1 }, { unique: true });
db.categories.createIndex({ "order": 1 });

// Favorites collection
db.createCollection('favorites');
db.favorites.createIndex({ "userId": 1, "navItemId": 1 }, { unique: true });
db.favorites.createIndex({ "userId": 1 });

print('📊 Creating initial data...');

// Insert default categories
db.category.insertMany([
  {
    name: '开发工具',
    description: '编程开发相关工具',
    icon: 'code',
    order: 1,
    createdAt: new Date()
  },
  {
    name: '设计资源',
    description: '设计素材和工具',
    icon: 'design',
    order: 2,
    createdAt: new Date()
  },
  {
    name: '学习资源',
    description: '在线学习平台',
    icon: 'book',
    order: 3,
    createdAt: new Date()
  },
  {
    name: '工具软件',
    description: '实用工具软件',
    icon: 'tool',
    order: 4,
    createdAt: new Date()
  },
  {
    name: '娱乐休闲',
    description: '娱乐和休闲网站',
    icon: 'game',
    order: 5,
    createdAt: new Date()
  }
]);

print('✅ MongoDB initialization completed successfully!');
print('📋 Collections created: users, navitems, categories, favorites');
print('🔍 Indexes created for optimal query performance');
print('📝 Default categories inserted');

// Show collection stats
print('\n📊 Database status:');
print('Collections: ' + db.getCollectionNames().length);
print('Categories: ' + db.category.countDocuments());