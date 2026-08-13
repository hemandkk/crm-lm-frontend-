import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.18.4"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "edp-aws-bucket.s3.ap-south-1.amazonaws.com", //*.amazonaws.com Authorizes private S3 runtime images safely
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Docker/Render build: self-contained server output (node server.js).
  // Skipped on Vercel, which runs its own server and ignores `standalone`.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
