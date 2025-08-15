import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
  destination: 'http://localhost:3003/:path*'
      }
    ]
  }
}

export default nextConfig
