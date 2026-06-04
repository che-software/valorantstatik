import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev modunda ngrok domain'lerine izin ver
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
  ],

  // Image Optimization — Vercel'de otomatik WebP/AVIF dönüşümü
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "media.valorant-api.com" },
      { protocol: "https", hostname: "assets.henrikdev.xyz" },
      { protocol: "https", hostname: "trackercdn.com" },
      { protocol: "https", hostname: "*.ngrok-free.app" },
      { protocol: "https", hostname: "*.ngrok-free.dev" },
    ],
    // Ajan/rank ikonları için agresif cache
    minimumCacheTTL: 86400, // 24 saat
  },

  // Güvenlik ve performans header'ları
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ngrok uyarı ekranını atla
          { key: "ngrok-skip-browser-warning", value: "true" },
          // Clickjacking koruması
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // XSS koruması
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer politikası
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // Statik asset'ler için uzun cache
      {
        source: "/(.*)\\.(ico|png|jpg|jpeg|svg|webp|avif|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  // Üretim build optimizasyonları
  compress: true,
  poweredByHeader: false,
  // Vercel Turbopack uyumluluk sorunu için webpack kullan
  turbopack: undefined,
};

export default nextConfig;
