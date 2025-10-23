import { EggAppConfig, PowerPartial } from 'egg';
import os from 'os';
// 根据环境变量或默认值设置
export default () => {
  const workers = process.env.EGG_WORKERS || Math.min(os.cpus().length, 2); // 最多2个worker
  const config: PowerPartial<EggAppConfig> = {};
  config.cluster = {
    listen: {
      workers: parseInt(workers, 10),
    },
  };
  return config;
};
