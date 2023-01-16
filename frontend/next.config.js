/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'deforestation-areas-1999.s3.us-east-1.amazonaws.com',
      },
    ],
  },
}

module.exports = nextConfig
