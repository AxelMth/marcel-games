/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export required for Capacitor to embed the web assets
  output: "export",
  // Disable image optimisation for static export
  images: {
    unoptimized: true,
  },
  // Transpile shared workspace packages
  transpilePackages: ["@marcel-games/ui", "@marcel-games/lib"],
};

export default nextConfig;
