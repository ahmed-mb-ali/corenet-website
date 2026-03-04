import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Corenet - Building the Modern Workforce Technology",
  description:
    "Corenet is a technology holding company building and scaling platforms that power modern workforce solutions across the region and beyond.",
  keywords: [
    "Corenet",
    "Hires HR",
    "hiring platform",
    "recruitment software",
    "ATS",
    "applicant tracking system",
    "AI resume screening",
    "candidate pipeline",
    "interview scheduling",
    "HR technology",
    "workforce solutions",
    "career page builder",
    "hiring analytics",
    "multi-tenant recruitment",
  ],
  authors: [{ name: "Corenet" }],
  creator: "Corenet",
  publisher: "Corenet",
  metadataBase: new URL("https://corenet.io"),
  openGraph: {
    title: "Corenet - Building the Modern Workforce Technology",
    description:
      "Corenet builds and scales platforms that power modern workforce solutions — from AI-driven hiring to career page management.",
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_SA",
    siteName: "Corenet",
    images: [
      {
        url: "/images/product-dashboard.png",
        width: 1200,
        height: 630,
        alt: "Corenet - Hires HR Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corenet - Building the Modern Workforce Technology",
    description:
      "Corenet builds and scales platforms that power modern workforce solutions — from AI-driven hiring to career page management.",
    images: ["/images/product-dashboard.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexArabic.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
