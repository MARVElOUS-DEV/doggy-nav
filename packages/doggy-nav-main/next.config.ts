import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
  },
  // output: 'export',
  output: 'standalone',
  distDir: 'dist',
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV==='production',
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // 临时禁用静态优化来定位问题
  // skipTrailingSlashRedirect: true,
  // 启用详细日志
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // 启用详细日志
  // webpack: (config, { dev, isServer }) => {
  //   if (dev) {
  //     config.devtool = isServer? false: 'eval-source-map';
  //   }
  //   return config;
  // },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.alicdn.com',
        port: '',
        pathname: '/imgextra/**',
      }
    ],
  },
  // async rewrites() {
  //   // 只在开发环境启用代理
  //   if (process.env.NODE_ENV === 'development') {
  //     console.info('Setting up proxy rewrites...');
  //     return [
  //       {
  //         source: '/api/:path*',
  //         destination: `${process.env.SERVER ?? 'http://localhost:3002'}/api/:path*`,
  //       }
  //     ];
  //   }

  //   // 生产环境不使用代理
  //   return [];
  // },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);
