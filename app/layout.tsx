import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore: Allow importing global CSS without type declarations
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "SafeCloud - Secure Personal Cloud Storage",
  description: "Secure cloud storage for your personal files",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}