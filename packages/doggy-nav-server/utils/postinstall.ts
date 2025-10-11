import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import userModel from '../app/model/user';
import * as readline from 'readline';
import mongoCfg from '../config/mongodb';
import applicationModel from '../app/model/application';
import * as crypto from 'crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string, isPassword: boolean = false): Promise<string> => {
  return new Promise(resolve => {
    const prompt = isPassword ? `${query} (hidden): ` : `${query}: `;
    rl.question(prompt, answer => {
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
    const db = await mongoose.connect(mongoUrl) as any;
    db.mongoose = mongoose;

    const userSchemaModel = userModel(db);
    const applicationSchemaModel = applicationModel(db);
    console.info('mongoUrl', mongoUrl);

    const username = await askQuestion('Enter username (default: admin)', false);
    const finalUsername = username.trim() || 'admin';

    const password = await askQuestion('Enter password (default: admin123)', true);
    const finalPassword = await bcrypt.hash(password.trim() || 'admin123', 12);

    const {modifiedCount, upsertedCount, matchedCount} = await userSchemaModel.updateOne({
      username: { $eq: finalUsername },
    }, { password: finalPassword, isAdmin: true, email: 'admin@doggy-nav.cn', isActive: true }, { upsert: true });

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
      console.info('➡️  Next steps: add this secret to main (SERVER_CLIENT_SECRET) and admin (UMI_APP_CLIENT_SECRET) envs, then set REQUIRE_CLIENT_SECRET=true on the server.');
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
