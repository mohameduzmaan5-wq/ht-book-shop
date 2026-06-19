import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "fswib-203-189-75-82.run.pinggy-free.link",
    "imeko-203-189-75-82.free.pinggy.net",
    "vanilla-lance-minimum-active.trycloudflare.com",
  ],
};

export default nextConfig;
