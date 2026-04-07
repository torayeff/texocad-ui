import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ThemeProvider from "@/app/components/ThemeProvider";
import "./globals.css";

const SITE_NAME = "TexoCAD";
const SITE_URL = "https://texocad.ai";
const SITE_TITLE = "TexoCAD - Agentic Text-to-CAD";
const SITE_DESCRIPTION =
  "Agentic text-to-CAD for people building physical products. Turn ideas, requirements, and sketches into editable, manufacturing-ready CAD.";
const SITE_KEYWORDS = [
  "text to CAD",
  "agentic CAD",
  "AI CAD",
  "3D CAD",
  "engineering drawings to CAD",
  "CAD model generation",
  "manufacturability checks",
  "rapid prototyping",
  "prototype CAD",
  "natural language CAD",
  "parametric CAD",
  "CAD automation",
  "BREP CAD",
  "STL export",
  "STEP export",
];

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
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    countryName: "US",
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
