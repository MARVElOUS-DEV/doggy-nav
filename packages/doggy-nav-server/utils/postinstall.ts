import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import userModel from '../app/model/user';
import * as readline from 'readline';

const mongoUrl = `mongodb://${process.env.MONGO_URL || '127.0.0.1:27017'}/navigation`;
const db = mongoose.connect(mongoUrl) as any;
db.mongoose = mongoose;

const userSchemaModel = userModel(db);

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
    console.info('mongoUrl', mongoUrl);

    const username = await askQuestion('Enter username (default: admin)', false);
    const finalUsername = username.trim() || 'admin';

    const password = await askQuestion('Enter password (default: admin123)', true);
    const finalPassword = await bcrypt.hash(password.trim() || 'admin123', 12);

    const res = await userSchemaModel.updateOne({
      username: { $eq: finalUsername },
    }, { password: finalPassword, isAdmin: true, email: 'admin@doggy-nav.cn', isActive: true }, { create: true });

    if (res) {
      console.info(`create user ${finalUsername} with password ${finalPassword} success ✅`);
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
