import '@/lib/suppress-console';
import '@/lib/polyfills';
import type { Metadata } from "next";
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

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Jackerbox - Rent Equipment from Local Owners",
  description: "Rent equipment from local owners or list your own equipment for rent. Jackerbox connects equipment owners with renters in a secure, community-driven marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
