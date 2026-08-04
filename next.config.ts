import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.18.4"],
  // Minimal self-contained server output for Docker (node server.js in .next/standalone)
  output: "standalone",
};

export default nextConfig;
