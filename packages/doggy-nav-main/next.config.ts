import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // transpilePackages: [
  //   '@arco-design/web-react'
  // ],
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
  },
  // output: 'export',
  distDir: 'dist',
  // 临时禁用静态优化来定位问题
  skipTrailingSlashRedirect: true,
  // 启用详细日志
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // 启用详细日志
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = isServer? false: 'eval-source-map';
    }
    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns: [{
        protocol: 'https',
        hostname: 'img.alicdn.com',
        port: '',
        pathname: '/imgextra/**',
      },],
  },
  async rewrites() {
    // 只在开发环境启用代理
    if (process.env.NODE_ENV === 'development') {
      console.log('Setting up proxy rewrites...');
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.SEVER?? 'http://localhost:3002'}/api/:path*`,
        }
      ];
    }
    
    // 生产环境不使用代理
    return [];
  },
};
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
export default withBundleAnalyzer(nextConfig);
