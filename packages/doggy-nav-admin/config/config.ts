import { defineConfig } from '@umijs/max';
import routes from './routes';

// Dev proxy target and secret injection (server-side only in dev)
const serverTarget = (() => {
  const s = process.env.DOGGY_SERVER;
  if (!s) return 'http://localhost:3002';
  return s.startsWith('http') ? s : `http://${s}`;
})();
const devClientSecret =
  process.env.DOGGY_SERVER_CLIENT_SECRET || process.env.SERVER_CLIENT_SECRET;
const clientEnv = {
  'process.env.UMI_APP_COPY_RIGHT_TEXT': JSON.stringify(
    process.env.UMI_APP_COPY_RIGHT_TEXT || '',
  ),
  'process.env.UMI_APP_IMAGE_SERVICE_URL': JSON.stringify(
    process.env.UMI_APP_IMAGE_SERVICE_URL || '',
  ),
};

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {},
  headScripts: [{ src: '/runtime-config.js' }],
  routes,
  npmClient: 'pnpm',
  esbuildMinifyIIFE: true,
  define: clientEnv,
  proxy:
    process.env.NODE_ENV === 'development'
      ? {
          '/api': {
            target: serverTarget,
            changeOrigin: true,
            headers: devClientSecret
              ? { 'x-client-secret': devClientSecret }
              : {},
          },
          // OpenAI-compatible test endpoint
          '/v1': {
            target: serverTarget,
            changeOrigin: true,
            headers: devClientSecret
              ? { 'x-client-secret': devClientSecret }
              : {},
          },
        }
      : {},
});
