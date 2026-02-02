const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable Next.js 16 features per specifications
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    viewTransitions: true,
  },
}

export default nextConfig
