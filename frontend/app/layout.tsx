import type { Metadata } from "next";
import React from "react";
import { Inter, Permanent_Marker } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Layout/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const marker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marker",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReliefOS — Field Intelligence for NGO Action",
  description:
    "A paper-first anticipatory action engine that converts handwritten field reports into trusted early warnings and real-time volunteer deployment plans.",
  keywords: ["NGO", "disaster relief", "dengue", "anticipatory action", "field reports"],
};

import { Providers } from "./components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${marker.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          <div className="pt-20 flex-1 flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
