import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import userModel from '../app/model/user';
import roleModel from '../app/model/role';
import * as readline from 'readline';
import mongoCfg from '../config/mongodb';
import applicationModel from '../app/model/application';
import * as crypto from 'crypto';
import { DEFAULT_ROLES } from '../app/permissions';
import groupModel from '../app/model/group';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string, isPassword: boolean = false): Promise<string> => {
  return new Promise((resolve) => {
    const prompt = isPassword ? `${query} (hidden): ` : `${query}: `;
    rl.question(prompt, (answer) => {
      if (isPassword) {
        // Clear the line after password input to hide it from console history
        process.stdout.write('\x1B[1A'); // Move cursor up one line
        process.stdout.write('\x1B[2K'); // Clear the entire line
        process.stdout.write(`${prompt}${'*'.repeat(answer.length)}\n`); // Show masked input
      }
      resolve(answer);
    });
  });
};

(async () => {
  try {
    const mongoUrl = mongoCfg.mongoUrl;
    const db = (await mongoose.connect(mongoUrl)) as unknown as { mongoose: typeof mongoose };
    db.mongoose = mongoose;

    const userSchemaModel = userModel(db);
    const roleSchemaModel = roleModel(db);
    const groupSchemaModel = groupModel(db);
    const applicationSchemaModel = applicationModel(db);
    console.info('mongoUrl', mongoUrl);

    const username = await askQuestion('Enter username (default: admin)', false);
    const finalUsername = username.trim() || 'admin';

    const password = await askQuestion('Enter password (default: Admin123)', true);
    const finalPassword = await bcrypt.hash(password.trim() || 'Admin123', 12);

    const { modifiedCount, upsertedCount, matchedCount } = await userSchemaModel.updateOne(
      {
        username: { $eq: finalUsername },
      },
      { password: finalPassword, email: 'admin@doggy-nav.cn', isActive: true },
      { upsert: true }
    );
    // Seed default roles
    const roleDocs: Record<string, { _id: string; slug: string }> = {};
    for (const key of Object.keys(DEFAULT_ROLES)) {
      const def = (
        DEFAULT_ROLES as unknown as Record<
          string,
          { slug: string; displayName: string; isSystem?: boolean; permissions: string[] }
        >
      )[key];
      const existing = await roleSchemaModel.findOne({ slug: def.slug });
      if (!existing) {
        const created = await roleSchemaModel.create({
          slug: def.slug,
          displayName: def.displayName,
          permissions: def.permissions,
          isSystem: def.isSystem,
        });
        roleDocs[def.slug] = created;
      } else {
        roleDocs[def.slug] = existing;
      }
    }

    const sysAdminRole =
      roleDocs['sysadmin'] || (await roleSchemaModel.findOne({ slug: 'sysadmin' }));
    if (sysAdminRole) {
      // ensure the created/updated admin user is sysadmin
      await userSchemaModel.updateOne(
        { username: finalUsername },
        { $addToSet: { roles: sysAdminRole._id } }
      );
      console.info(`ensured ${finalUsername} has sysadmin role ✅`);
    }

    // Ensure default linuxdo group exists
    const linuxdo = await groupSchemaModel.findOne({ slug: 'linuxdo' });
    if (!linuxdo) {
      await groupSchemaModel.create({
        slug: 'linuxdo',
        displayName: 'LinuxDo',
        description: 'Users authenticated via LinuxDo',
      });
      console.info('created default group "linuxdo" ✅');
    } else {
      console.info('default group "linuxdo" exists ✅');
    }

    if (modifiedCount || upsertedCount || matchedCount) {
      console.info(`create user ${finalUsername} with password ${finalPassword} success ✅`);
    }

    // Ensure a default client application exists with a generated client secret
    const applicationsCount = await applicationSchemaModel.countDocuments();
    if (applicationsCount === 0) {
      const clientSecret = crypto.randomBytes(32).toString('hex');
      const defaultAppName = process.env.DEFAULT_CLIENT_APP_NAME || 'default-app';
      const appDoc = await applicationSchemaModel.create({
        name: defaultAppName,
        description: 'Auto-created by postinstall script',
        clientSecret,
        allowedOrigins: [],
        isActive: true,
      });
      console.info('✅ Default client application created:', {
        id: appDoc._id?.toString?.() || appDoc._id,
        name: appDoc.name,
      });
      console.info('🔑 Client Secret (store securely, shown once):', clientSecret);
      console.info('➡️  Next steps:');
      console.info(
        '   - Main (Next.js): set SERVER_CLIENT_SECRET to this value (requests go via Next.js API routes).'
      );
      console.info('   - Admin: DO NOT expose in browser env.');
      console.info(
        '       • Dev: configure Umi dev proxy to inject header x-client-secret from DOGGY_SERVER_CLIENT_SECRET.'
      );
      console.info(
        '       • Prod: set DOGGY_SERVER_CLIENT_SECRET in nginx (proxy_set_header x-client-secret).'
      );
      console.info('   - Finally set REQUIRE_CLIENT_SECRET=true on the server and restart.');
    } else {
      console.info('ℹ️  Client applications already exist, skipping default client creation.');
    }
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await mongoose.disconnect();
    console.info('🔌 Database connection closed.');
    rl.close();
    process.exit(0);
  }
})();
