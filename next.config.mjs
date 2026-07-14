/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Question figures are remote SVGs; we render them with plain <img>, so no
  // next/image remote config is needed.

  // The per-unit question JSON in /public/data is large but changes only when
  // we rebuild the bank. By default Next serves public/ files with
  // `Cache-Control: public, max-age=0`, forcing a revalidation round-trip on
  // every visit. Cache them for an hour and serve stale-while-revalidate for a
  // day so reloads and back-navigation are instant instead of re-downloading.
  async headers() {
    return [
      {
        source: "/data/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
