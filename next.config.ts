import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
  destination: 'http://127.0.0.1:3003/:path*'
      }
    ]
  }
}

export default nextConfig
