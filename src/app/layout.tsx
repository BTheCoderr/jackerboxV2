import '@/lib/suppress-console';
import '@/lib/polyfills';
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { MobileOptimizedLayout } from "@/components/mobile/mobile-optimized-layout";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SocketStatusIndicator } from '@/components/SocketStatusIndicator';
import { SSEStatusIndicator } from '@/components/SSEStatusIndicator';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jackerbox - Rent Equipment from Local Owners",
  description: "Rent equipment from local owners or list your own equipment for rent. Jackerbox connects equipment owners with renters in a secure, community-driven marketplace.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jackerbox"
  }
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/api/pwa/splash?width=2048&height=2732" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/api/pwa/splash?width=1668&height=2388" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/api/pwa/splash?width=1536&height=2048" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/api/pwa/splash?width=1125&height=2436" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/api/pwa/splash?width=1242&height=2688" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/api/pwa/splash?width=828&height=1792" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/api/pwa/splash?width=750&height=1334" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/api/pwa/splash?width=640&height=1136" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
        <link rel="preload" href="/icons/icon-512x512.png" as="image" />
        
        {/* Add preconnect for external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <Providers>
          <MobileOptimizedLayout>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </MobileOptimizedLayout>
          <Toaster position="top-center" />
          <SocketStatusIndicator />
          <SSEStatusIndicator />
          <InstallPrompt />
          <Script src="/register-sw.js" strategy="afterInteractive" />
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
