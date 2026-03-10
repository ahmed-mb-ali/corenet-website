import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hires - AI-Powered Hiring Platform",
  description:
    "Explore Corenet's AI-powered hiring products. Smarter screening, candidate pipelines, career pages, and analytics built for companies in Saudi Arabia and the MENA region.",
  openGraph: {
    title: "Hires - AI-Powered Hiring Platform",
    description:
      "Smarter screening, candidate pipelines, career pages, and analytics — built for companies in Saudi Arabia.",
    url: "https://www.corenet.sa/hires",
    images: [{ url: "/images/og-hires.png?v=4", width: 1200, height: 630, alt: "Hires by Corenet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hires - AI-Powered Hiring Platform",
    description: "Smarter screening, candidate pipelines, career pages, and analytics.",
    images: ["/images/og-hires.png?v=4"],
  },
  alternates: { canonical: "/hires" },
};

export default function HiresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
