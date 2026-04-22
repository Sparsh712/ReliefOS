import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/Layout/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReliefOS — Field Intelligence for NGO Action",
  description:
    "A paper-first anticipatory action engine that converts handwritten field reports into trusted early warnings and real-time volunteer deployment plans.",
  keywords: ["NGO", "disaster relief", "dengue", "anticipatory action", "field reports"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
