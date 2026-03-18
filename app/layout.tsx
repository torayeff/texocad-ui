import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/app/components/ThemeProvider";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

const SITE_NAME = "TEXOCAD";
const SITE_URL = "https://texocad.com";
const SITE_TITLE = "TEXOCAD | Text-to-CAD for Production-Ready Parts";
const SITE_DESCRIPTION =
  "TEXOCAD is text-to-CAD for product teams. Turn plain-English requirements, sketches, and engineering drawings into manufacturable CAD, refine designs with AI agents, and export STEP or STL files.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s - ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "text to CAD",
    "text-to-CAD",
    "agentic CAD",
    "AI CAD",
    "3D CAD",
    "engineering drawings to CAD",
    "CAD model generation",
    "manufacturability checks",
    "STL export",
    "STEP export",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
