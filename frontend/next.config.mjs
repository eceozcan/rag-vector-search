/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy all /api/* and /mcp/* calls to the backend server (default :4000),
  // so the frontend can use relative paths without hardcoding the backend URL.
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
      { source: '/mcp/:path*', destination: `${backend}/mcp/:path*` },
    ];
  },
};

export default nextConfig;