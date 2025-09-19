import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
  return  {
        fallback: [
          {
            source: '/:api*',
            destination: `${process.env.SEVER?? 'http://localhost:3002'}/:api*`,
          },
        ],
      }
  },
};

export default nextConfig;
