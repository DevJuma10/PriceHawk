/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['mongoose', 'puppeteer-core'],
  },
  images: {
    domains: ['m.media-amazon.com'],
  },
}

module.exports = nextConfig
