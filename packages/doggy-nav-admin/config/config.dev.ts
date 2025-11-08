import { defineConfig } from '@umijs/max';
import routes from './routes';

// Dev proxy target and secret injection
const serverTarget = (() => {
  const s = process.env.DOGGY_SERVER;
  if (!s) return 'http://127.0.0.1:3002';
  return s.startsWith('http') ? s : `http://${s}`;
})();
const devClientSecret = process.env.DOGGY_SERVER_CLIENT_SECRET;

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {},
  routes,
  npmClient: 'pnpm',
  proxy: {
    '/api': {
      target: serverTarget,
      changeOrigin: true,
      headers: devClientSecret ? { 'x-client-secret': devClientSecret } : {},
    },
  },
  define: {
    'process.env': process.env,
  },
});
