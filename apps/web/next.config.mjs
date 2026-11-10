/** @type {import('next').NextConfig} */
const deskApiUrl = process.env.DESK_API_URL || process.env.NEXT_PUBLIC_DESK_API_URL || 'http://localhost:8000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${deskApiUrl}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
