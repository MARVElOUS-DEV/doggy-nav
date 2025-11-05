import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import roleModel from '../app/model/role';
import userModel from '../app/model/user';
import groupModel from '../app/model/group';
import categoryModel from '../app/model/category';
import navModel from '../app/model/nav';
import mongoCfg from '../config/mongodb';
import * as Core from 'doggy-nav-core';

async function withDb<T>(fn: (ctx: any) => Promise<T>): Promise<T> {
  const mongoUrl = mongoCfg.mongoUrl;
  const db = (await mongoose.connect(mongoUrl)) as any;
  db.mongoose = mongoose;
  try {
    return await fn(db);
  } finally {
    await mongoose.disconnect();
  }
}

async function seedDefaultsCLI() {
  return withDb(async (db) => {
    const Role = roleModel(db);
    const User = userModel(db);
    const Group = groupModel(db);

    const writers: Core.SeedWriters = {
      async ensureRole(role) {
        const found = await Role.findOne({ slug: role.slug });
        if (found) return String(found._id);
        const created = await Role.create({
          slug: role.slug,
          displayName: role.displayName,
          description: role.description || '',
          permissions: role.permissions || [],
          isSystem: !!role.isSystem,
        });
        return String(created._id);
      },
      async ensureGroup(group) {
        const found = await Group.findOne({ slug: group.slug });
        if (found) return String(found._id);
        const created = await Group.create({
          slug: group.slug,
          displayName: group.displayName,
          description: group.description || '',
        });
        return String(created._id);
      },
      async ensureUser({ username, email, passwordHash, nickName }) {
        const found = await User.findOne({ email });
        if (found) return String(found._id);
        const created = await User.create({
          username,
          email,
          password: passwordHash,
          isActive: true,
          nickName: nickName || '',
        });
        return String(created._id);
      },
      async addUserToRole(userId, roleId) {
        await User.updateOne({ _id: userId }, { $addToSet: { roles: roleId } });
      },
      async addUserToGroup(userId, groupId) {
        await User.updateOne({ _id: userId }, { $addToSet: { groups: groupId } });
      },
      async upsertTopCategory() { throw new Error('not used in defaults'); },
      async bookmarkExists() { return false; },
      async insertBookmark() { /* noop */ },
    } as any;

    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@doggy-nav.cn';
    const plain = process.env.ADMIN_PASSWORD || 'admin123';
    const nickName = process.env.ADMIN_NICKNAME || 'Administrator';
    const passwordHash = await bcrypt.hash(plain, 12);

    await Core.seedDefaults(writers, { username, email, password: passwordHash, nickName });
  });
}

async function seedCategoriesCLI() {
  return withDb(async (db) => {
    const Category = categoryModel(db);
    const Nav = navModel(db);

    const writers: Core.SeedWriters = {
      async ensureRole() { throw new Error('not used'); },
      async ensureGroup() { throw new Error('not used'); },
      async ensureUser() { throw new Error('not used'); },
      async addUserToRole() {},
      async addUserToGroup() {},
      async upsertTopCategory({ name, description, icon, createAt, parentVirtualId }) {
        const found = await Category.findOne({ name });
        if (found) return String(found._id);
        const created = await Category.create({
          name,
          description: description || '',
          categoryId: parentVirtualId,
          createAt: createAt || Core.nowChromeTime(),
          onlyFolder: false,
          icon: icon || '',
          showInMenu: true,
          audience: { visibility: 'public', allowRoles: [], allowGroups: [] },
        });
        return String(created._id);
      },
      async bookmarkExists(catId, { name, href }) {
        const existing = await Nav.findOne({ categoryId: catId, name, href });
        return !!existing;
      },
      async insertBookmark(catId, { name, href, desc, logo, createTime }) {
        await Nav.create({
          categoryId: catId,
          name,
          href,
          desc: desc || '',
          logo: logo || '',
          createTime: createTime || Core.nowChromeTime(),
          tags: [],
          view: 0,
          star: 0,
          status: 0,
          isFavorite: false,
          urlStatus: 'unknown',
          lastUrlCheck: null,
          responseTime: null,
          audience: { visibility: 'public', allowRoles: [], allowGroups: [] },
        });
      },
    } as any;

    await Core.seedCategories(writers, { force: process.argv.includes('--force') });
  });
}

async function main() {
  const cmd = process.argv[2] || 'defaults';
  if (cmd === 'defaults') {
    await seedDefaultsCLI();
    console.info('✅ Seed defaults complete');
  } else if (cmd === 'categories') {
    await seedCategoriesCLI();
    console.info('✅ Seed categories complete');
  } else {
    console.error('Unknown command. Use: defaults | categories');
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
