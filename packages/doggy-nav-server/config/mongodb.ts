const MONGO_URL = process.env.MONGO_URL || process.env.MONGO_URL;
const isCloudUrl = MONGO_URL && /^mongodb.*:\/\//i.test(MONGO_URL);
const config = {
  mongoUrl: isCloudUrl ? MONGO_URL : `mongodb://${MONGO_URL || '127.0.0.1:27017'}/navigation`,
};
export default config;
