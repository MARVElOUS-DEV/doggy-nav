import { defineConfig } from '@umijs/max';
import routes from './routes';

// Dev proxy target and secret injection (server-side only in dev)
const serverTarget = (() => {
  const s = process.env.DOGGY_SERVER;
  if (!s) return 'http://localhost:3002';
  return s.startsWith('http') ? s : `http://${s}`;
})();
const devClientSecret = process.env.DOGGY_SERVER_CLIENT_SECRET || process.env.SERVER_CLIENT_SECRET;

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {},
  routes,
  npmClient: 'pnpm',
  esbuildMinifyIIFE: true,
  proxy: process.env.NODE_ENV === 'development' ? {
    '/api': {
      target: serverTarget,
      changeOrigin: true,
      // Ensure admin dev server injects client secret at proxy layer
      headers: devClientSecret ? { 'x-client-secret': devClientSecret } : {},
    },
  } : {},
});
