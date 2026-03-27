import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import pkg from "./package.json";

// Configuração do plugin PWA
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default withPWA(nextConfig);
