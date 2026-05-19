import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Caveat, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers/Providers";
import { NavBar } from "@/components/layout/NavBar";
import { FilterDefs } from "@/components/ui/FilterDefs";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
  weight: ["400", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
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
        className={`${GeistSans.variable} ${GeistMono.variable} ${caveat.variable} ${lora.variable} antialiased`}
      >
        <FilterDefs />
        <NavBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
