import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { Suspense } from "react";

const geist     = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kedipotter-tracker.vercel.app";

// SEO — Riot Games geliştirici programı kapsamındaki ürün için metadata
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "KediPotter Tracker · Valorant İstatistik Platformu",
    template: "%s · KediPotter Tracker",
  },
  description:
    "Riot Games geliştirici kurallarına uyumlu Valorant istatistik ve rank takip platformu. Maç geçmişi, performans metrikleri ve leaderboard.",
  keywords: [
    "valorant tracker", "valorant stats", "valorant rank", "valorant istatistik",
    "valorant leaderboard", "valorant match history", "kedipotter tracker",
  ],
  authors: [{ name: "KediPotter" }],
  creator: "KediPotter",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: APP_URL,
    siteName: "KediPotter Tracker",
    title: "KediPotter Tracker · Valorant İstatistik Platformu",
    description: "Valorant oyuncuları için ücretsiz istatistik ve rank takip platformu.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "KediPotter Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KediPotter Tracker · Valorant İstatistik Platformu",
    description: "Valorant oyuncuları için ücretsiz istatistik ve rank takip platformu.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  // Riot Games Developer Policy gereği açık kaynak bildirimi
  other: {
    "riot-disclaimer": "Not affiliated with Riot Games",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased font-[var(--font-geist)] flex flex-col">
        <Suspense>
          <SettingsProvider>
            <AuthProvider>
              <Navbar />
              {children}
              <Footer />
            </AuthProvider>
          </SettingsProvider>
        </Suspense>
      </body>
    </html>
  );
}
