import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers/query-provider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gent Banden - Facturatie & Beheer",
  description: "Professioneel facturatiesysteem voor Gent Bandenservice. Beheer facturen, klanten en bandenvoorraad eenvoudig en efficiënt.",
  keywords: ["bandencentrale", "gent", "facturatie", "banden", "auto onderhoud", "bandenwissel", "uitlijnen"],
  authors: [{ name: "Gent Banden" }],
  openGraph: {
    title: "Gent Banden - Facturatie & Beheer",
    description: "Professioneel facturatiesysteem voor Gent Bandenservice.",
    siteName: "Gent Banden",
    locale: "nl_BE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
