const isCloudUrl = process.env.MONGO_URL && /^mongodb.*:\/\//i.test(process.env.MONGO_URL);
export default {
  mongoUrl: isCloudUrl ? process.env.MONGO_URL : `mongodb://${process.env.MONGO_URL || '127.0.0.1:27017'}/navigation`,
};
