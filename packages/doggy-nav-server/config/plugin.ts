import { EggPlugin } from 'egg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const plugin: EggPlugin = {
  // static: true,
  // nunjucks: {
  //   enable: true,
  //   package: 'egg-view-nunjucks',
  // },

  mongoose: {
    enable: true, // 开启插件
    package: 'egg-mongoose',
  },
  jwt: {
    enable: true,
    package: 'egg-jwt',
  },
};

export default plugin;
