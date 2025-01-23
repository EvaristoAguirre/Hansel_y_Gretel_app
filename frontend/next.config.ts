import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  i18n: require("./next-i18next.config.js").i18n,
};

export default nextConfig;
