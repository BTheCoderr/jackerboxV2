import '@/lib/suppress-console';
import '@/lib/polyfills';
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
import { NotificationPermission } from '@/components/pwa/NotificationPermission';
import { NetworkStatus } from '@/components/pwa/NetworkStatus';
import { SessionStateManager } from '@/lib/auth/session-fix';

// Optimize font loading - preload with display swap
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Jackerbox',
    default: 'Jackerbox - Peer-to-Peer Equipment Rental',
  },
  description: 'Rent equipment from people in your area or list your own equipment for others to rent.',
  keywords: ['equipment rental', 'peer-to-peer', 'tools', 'camera', 'outdoor gear'],
  authors: [{ name: 'Jackerbox Team' }],
  creator: 'Jackerbox',
  publisher: 'Jackerbox',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jackerbox",
    startupImage: [
      {
        url: "/icons/splash/apple-splash-2048-2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/icons/splash/apple-splash-1668-2388.png",
        media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/icons/splash/apple-splash-1536-2048.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/icons/splash/apple-splash-1125-2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/icons/splash/apple-splash-1242-2688.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      },
      {
        url: "/icons/splash/apple-splash-828-1792.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/icons/splash/apple-splash-750-1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/icons/splash/apple-splash-640-1136.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" type="image/png" />
        <link rel="preload" href="/icons/icon-512x512.png" as="image" />
        
        {/* Add preconnect for external resources */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vercel.com" />
        
        {/* DNS prefetch for third-party domains */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://vercel.com" />
        
        {/* PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jackerbox" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="application-name" content="Jackerbox" />
        
        {/* Performance optimization meta tags */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Inline critical CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-sans: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            --foreground-rgb: 0, 0, 0;
            --background-start-rgb: 250, 250, 250;
            --background-end-rgb: 255, 255, 255;
          }
          body {
            color: #171717;
            background: #ffffff;
            font-family: var(--font-sans);
            margin: 0;
            padding: 0;
          }
          img {
            max-width: 100%;
            height: auto;
            display: block;
          }
        `}} />
        
        {/* Preload critical routes */}
        <link rel="prefetch" href="/routes/equipment" />
        <link rel="prefetch" href="/routes/dashboard" />
        <link rel="prefetch" href="/auth/login" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>
          <SessionStateManager />
          <MobileOptimizedLayout>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </MobileOptimizedLayout>
          <Toaster position="bottom-right" />
          <SocketStatusIndicator />
          <SSEStatusIndicator />
          <InstallPrompt />
          <NotificationPermission />
          <NetworkStatus />
        </Providers>
        <Analytics />
        <SpeedInsights />
        
        {/* Scripts */}
        <Script src="/register-sw.js" strategy="afterInteractive" />
        <Script src="/fix-cls.js" strategy="afterInteractive" />
        <Script src="/preload-critical.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
