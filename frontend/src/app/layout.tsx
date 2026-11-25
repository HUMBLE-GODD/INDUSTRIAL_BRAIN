import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

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
      <body className="font-sans bg-[#080c14] text-slate-100 antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
