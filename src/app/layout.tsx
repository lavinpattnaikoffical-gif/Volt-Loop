import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SITE_CONFIG } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
  description: `${SITE_CONFIG.secondaryTagline} Discover verified home EV chargers, book overnight charging, and turn underutilized private infrastructure into community power.`,
  keywords: [
    "EV charging",
    "community chargers",
    "electric vehicles",
    "Tata Nexon EV",
    "overnight charging",
    "home charger sharing",
    "VoltLoop",
    "Maharashtra EV route",
  ],
};

import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col bg-[#000000] text-[#ededed] selection:bg-white selection:text-black font-sans`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileBottomNav />
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
