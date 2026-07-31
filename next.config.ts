import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./security-headers";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    const spaRoutes = [
      "/",
      "/inicio",
      "/biblioteca",
      "/indice",
      "/indice/:part",
      "/indice/:part/:arc",
      "/leer/:chapter",
      "/leer/:chapter/:target",
    ];

    return {
      beforeFiles: spaRoutes.map((source) => ({ source, destination: "/index.html" })),
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS.map(({ key, value }) => ({ key, value })),
      },
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }],
      },
      {
        source: "/content/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
      ...["/app.js", "/library.js", "/styles.css"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      })),
    ];
  },
};

export default nextConfig;
