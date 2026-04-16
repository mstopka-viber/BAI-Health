import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // The service worker must not be cached by the browser itself;
      // otherwise updates never propagate.
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
