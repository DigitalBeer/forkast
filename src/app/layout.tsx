import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers/Providers";
import { NavBar } from "@/components/layout/NavBar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forkast",
  description: "Plan your meals with a warm, cookbook-inspired experience",
  openGraph: {
    title: "Forkast",
    description: "Plan your meals with a warm, cookbook-inspired experience",
    siteName: "Forkast",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${playfair.variable} antialiased`}
      >
        <NavBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
