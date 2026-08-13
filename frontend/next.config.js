/** @type {import('next').NextConfig} */
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  async rewrites() {
    return [
      {
        // Proxy /api/* to the backend. In production set the BACKEND_URL env var
        // on Vercel to your Railway backend URL. This makes the frontend call its
        // own origin (no CORS, no hardcoded localhost) and Vercel forwards the
        // request server-side to the backend.
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;