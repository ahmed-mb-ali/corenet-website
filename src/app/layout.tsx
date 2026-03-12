import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Corenet - Building the Modern Workforce Technology",
    template: "%s | Corenet",
  },
  description:
    "Corenet builds AI-powered hiring platforms that help companies in Saudi Arabia and the region recruit faster, screen smarter, and hire better — saving up to SR 8,500 per hire.",
  keywords: [
    "Corenet",
    "Hires HR",
    "hiring platform Saudi Arabia",
    "recruitment software KSA",
    "ATS",
    "applicant tracking system",
    "AI resume screening",
    "candidate pipeline management",
    "interview scheduling software",
    "HR technology Saudi",
    "workforce solutions MENA",
    "career page builder",
    "hiring analytics dashboard",
    "multi-tenant recruitment platform",
    "توظيف",
    "منصة توظيف",
    "نظام تتبع المتقدمين",
  ],
  authors: [{ name: "Corenet" }],
  creator: "Corenet",
  publisher: "Corenet",
  metadataBase: new URL("https://www.corenet.sa"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Corenet - Building the Modern Workforce Technology",
    description:
      "AI-powered hiring platforms that help companies recruit faster, screen smarter, and hire better. Trusted by businesses across Saudi Arabia and the MENA region.",
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_SA",
    siteName: "Corenet",
    url: "https://www.corenet.sa",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Corenet - Building the Modern Workforce Technology",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corenet - Building the Modern Workforce Technology",
    description:
      "AI-powered hiring platforms that help companies recruit faster, screen smarter, and hire better.",
    images: ["/images/og-image.png"],
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
