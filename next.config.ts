import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.figma.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "crm.corenet.sa" }],
        destination: "/crm/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
