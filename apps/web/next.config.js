const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {

  // Image Optimization — Vercel'de otomatik WebP/AVIF dönüşümü
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "media.valorant-api.com" },
      { protocol: "https", hostname: "assets.henrikdev.xyz" },
      { protocol: "https", hostname: "trackercdn.com" },
    ],
    // Ajan/rank ikonları için agresif cache
    minimumCacheTTL: 86400, // 24 saat
  },



  // Üretim build optimizasyonları
  compress: true,
  poweredByHeader: false,
  
  typescript: {
    ignoreBuildErrors: true,
  },

};

module.exports = nextConfig;
