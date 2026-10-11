/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize lucide-react tree-shaking (avoids bundling the full icon library)
  experimental: {
    optimizePackageImports: ["lucide-react", "@firecms/neat"],
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

export default nextConfig;
