/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/profiling/:path*',
        destination: 'http://localhost:8001/api/v1/profiling/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

