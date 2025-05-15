/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Set the port to 3001
  serverRuntimeConfig: {
    port: 3001
  },
  // Ensure development server runs on 3001
  devIndicators: {
    buildActivity: true
  }
};

export default nextConfig; 