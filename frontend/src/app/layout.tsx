import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Industrial Brain — Intelligent Operations Platform",
  description: "Enterprise cyber-physical asset monitoring, AI diagnostics, RCA & compliance dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#080c14] text-slate-100 antialiased`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
