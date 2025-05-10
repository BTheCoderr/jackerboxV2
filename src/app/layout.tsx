import '@/lib/suppress-console';
import '@/lib/polyfills';
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { MobileOptimizedLayout } from "@/components/mobile/mobile-optimized-layout";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from 'next/script';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { SessionStateManager } from '@/lib/auth/session-fix';
import { cn } from '@/lib/utils';
import { ClientStatusIndicators } from '@/components/ClientStatusIndicators';
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import { ClientOnly } from "@/lib/utils/hydration-safe";

export const metadata: Metadata = {
  metadataBase: new URL('https://jackerbox.app'),
  title: {
    default: "Jackerbox - Rent equipment from people in your area",
    template: "%s | Jackerbox"
  },
  description: "Jackerbox connects people who need equipment with those who have it. Find what you need or make money renting out your gear.",
  keywords: ["equipment rental", "peer-to-peer", "tool rental", "camera rental", "local rental"],
  authors: [
    {
      name: "Jackerbox Team",
      url: "https://jackerbox.app",
    },
  ],
  creator: "Jackerbox LLC",
  publisher: "Jackerbox",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jackerbox.app",
    title: "Jackerbox - Rent Equipment from People Near You",
    description: "Jackerbox lets you rent equipment from people in your area or make money by renting out your own tools, cameras, and more.",
    siteName: "Jackerbox",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Jackerbox - Rent Equipment from People Near You",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jackerbox - Rent Equipment from People Near You",
    description: "Jackerbox lets you rent equipment from people in your area or make money by renting out your own tools, cameras, and more.",
    creator: "@jackerboxapp",
    images: ["/twitter-image.jpg"],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: { url: '/apple-touch-icon.png' },
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#2980b9' }
    ]
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Jackerbox'
  }
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true
};

// Critical CSS that will be consistent between server and client
const criticalCSS = `
  :root {
    --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        {/* Add preconnect for external resources */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vercel.com" />
        
        {/* Load Inter font from Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* DNS prefetch for third-party domains */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://vercel.com" />
        
        {/* PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jackerbox" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Jackerbox" />
        
        {/* Performance optimization meta tags */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Move critical CSS to a safer implementation */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        
        {/* Prefetch critical routes instead of preload */}
        <link rel="prefetch" href="/routes/equipment" as="document" />
        <link rel="prefetch" href="/routes/dashboard" as="document" />
        <link rel="prefetch" href="/auth/login" as="document" />

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased" suppressHydrationWarning>
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
          <InstallPrompt />
          <ClientOnly>
            <ClientStatusIndicators />
          </ClientOnly>
        </Providers>
        <Analytics />
        <SpeedInsights />
        
        {/* Add fallback webpack.js to handle missing chunks */}
        <Script src="/webpack.js" strategy="beforeInteractive" />
        
        {/* Scripts with proper loading strategies */}
        <Script src="/register-sw.js" strategy="lazyOnload" />
        <Script src="/fix-cls.js" strategy="lazyOnload" />
        <Script src="/preload-critical.js" strategy="afterInteractive" />
        <Script src="/hydration-fix.js" strategy="afterInteractive" />
        
        {/* Add chunk error handler to recover from chunk load errors */}
        <Script src="/chunk-error-handler.js" strategy="beforeInteractive" />
        
        {/* Add CSS fix to prevent infinite CSS loading loops */}
        <Script src="/css-fix.js" strategy="beforeInteractive" />
        
        {/* Script to help prevent hydration errors */}
        <Script id="hydration-fix" strategy="beforeInteractive">{`
          // Attempt to prevent hydration mismatches by removing certain attributes
          // that might be different between server and client
          window.__NEXT_HYDRATION_HELPERS__ = {
            fixHydrationIssues: function() {
              // Remove problematic style attributes that might cause mismatches
              var problematicStyles = document.querySelectorAll('style[type="text/css"]');
              problematicStyles.forEach(function(style) {
                style.removeAttribute('type');
              });
            }
          };
          
          // Execute before hydration
          window.__NEXT_HYDRATION_HELPERS__.fixHydrationIssues();
          
          // Fix after react loads as a failsafe
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
              window.__NEXT_HYDRATION_HELPERS__.fixHydrationIssues();
            }, 0);
          });
        `}</Script>
      </body>
    </html>
  );
}
