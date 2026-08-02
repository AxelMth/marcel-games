// NEXT_PUBLIC_* is inlined at build time. An empty Mapbox token produces a blank
// map with no error at runtime, which is indistinguishable from a broken app.
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
) {
  throw new Error(
    "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is required for a production build. " +
      "Set it in .env.local locally, or in the Appflow environment for store builds."
  )
}

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
