import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jackerbox - Peer-to-Peer Equipment Rental",
  description: "Rent equipment from people in your area or make money renting out your gear.",
};

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
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-blue-600">Jackerbox</div>
              <nav className="hidden md:block">
                <ul className="flex space-x-6">
                  <li><a href="/" className="text-gray-600 hover:text-blue-600">Home</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-blue-600">About</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-blue-600">Contact</a></li>
                </ul>
              </nav>
            </div>
          </div>
        </header>
        <div className="flex-grow">
          {children}
        </div>
        <footer className="bg-gray-100 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-600">
              <p>© {new Date().getFullYear()} Jackerbox. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
