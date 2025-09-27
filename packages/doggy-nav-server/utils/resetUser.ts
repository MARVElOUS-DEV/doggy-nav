import mongoose from 'mongoose';
import userModel from '../app/model/user';
import { exit } from 'process';

const mongoUrl = `mongodb://${process.env.MONGO_URL || '127.0.0.1:27017'}/navigation`;
const db = mongoose.connect(mongoUrl) as any;
db.mongoose = mongoose;
// 引入数据模型模块
const userSchema = userModel(db);

(async (password="admin123") => {
  console.info("mongoUrl", mongoUrl, `passwd=> ${password}`);
  const [ f ] = await userSchema.find({
        username: { $eq: 'admin' },
      });
  console.info("find user:", f)
  if (f) {
    const res = await userSchema.updateOne({
        username: { $eq: 'admin' },
      }, {password});
    console.info("return res", res);
  }
  exit(0);
})(process.argv[2])
