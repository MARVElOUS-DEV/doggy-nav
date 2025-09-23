import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  model: {},
  request: {},
  initialState: {},
  // layout: Settings,
  proxy: {
    '/api': {
      'target': 'http://127.0.0.1:3002/',
      'changeOrigin': true,
    },
  },
});
