import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Configuração do plugin PWA
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Mantém desligado no dev para não cachear erros antigos
});

// Suas configurações normais do Next.js vão aqui dentro
const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
