import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Analytics } from "@vercel/analytics/react";
import { MobileLayout } from "@/components/mobile/mobile-layout";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SessionProvider } from "@/components/providers/session-provider";
import "./api/socket-init";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SessionProvider>
          <Navbar />
          <div className="flex-grow">
            <MobileLayout>{children}</MobileLayout>
          </div>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </SessionProvider>
      </body>
    </html>
  );
}
