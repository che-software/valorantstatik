import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider }     from "@/lib/auth-context";
import { SettingsProvider } from "@/lib/settings-context";
import { Suspense }         from "react";

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-inter",
  display:  "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kedipotter-tracker.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default:  "Che Tracker · Valorant Stats Platform",
    template: "%s · Che Tracker",
  },
  description:
    "Professional Valorant statistics and rank tracking platform by Che-Software. Match history, performance metrics, leaderboard — Riot Games Developer Policy compliant.",
  keywords: [
    "valorant tracker", "valorant stats", "valorant rank tracker",
    "valorant match history", "che tracker", "che-software", "valorant leaderboard",
  ],
  authors: [{ name: "Che-Software" }],
  creator: "Che-Software",
  openGraph: {
    type:      "website",
    locale:    "en_US",
    url:       APP_URL,
    siteName:  "Che Tracker",
    title:     "Che Tracker · Valorant Stats Platform",
    description: "Track your Valorant stats, rank, and match history — built by Che-Software.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Che Tracker" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Che Tracker · Valorant Stats Platform",
    description: "Track your Valorant stats, rank, and match history.",
    images:      ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  other: { "riot-disclaimer": "Not affiliated with Riot Games" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased flex flex-col bg-[#0d1117]">
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
