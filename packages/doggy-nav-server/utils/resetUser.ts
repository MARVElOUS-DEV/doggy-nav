import mongoose from 'mongoose';
import userModel from '../app/model/user';
import * as readline from 'readline';
import * as bcrypt from 'bcrypt';

const mongoUrl = `mongodb://${process.env.MONGO_URL || '127.0.0.1:27017'}/navigation`;
const db = mongoose.connect(mongoUrl) as any;
db.mongoose = mongoose;
// 引入数据模型模块
const userSchema = userModel(db);
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

    const username = await askQuestion('Enter the username which you want to reset', false);
    const finalUsername = username.trim();
    if (!finalUsername) {
      console.error('Username cannot be empty!');
      process.exit(1);
    }
    const [ f ] = await userSchema.find({
      username: { $eq: finalUsername },
    });
    if (!f) {
      console.error(`User ${finalUsername} does not exist!`);
      process.exit(1);
    }
    const password = await askQuestion('Enter password you want to reset to (default: admin123)', true);
    const finalPassword = await bcrypt.hash(password.trim() || 'admin123', 12);

    const res = await userSchema.updateOne({
      username: { $eq: finalUsername },
    }, { password: finalPassword });

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
