export default {
  dev: {
    '/api/': {
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
    },
  },
  pre: {
    '/api/': {
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
