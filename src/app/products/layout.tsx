import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hires - AI-Powered Hiring Platform",
  description:
    "Explore Corenet's AI-powered hiring products. Smarter screening, candidate pipelines, career pages, and analytics built for companies in Saudi Arabia and the MENA region.",
  openGraph: {
    title: "Hires - AI-Powered Hiring Platform",
    description:
      "Smarter screening, candidate pipelines, career pages, and analytics built for companies in Saudi Arabia.",
    url: "https://www.corenet.sa/products",
    images: [{ url: "/images/og-hires.png?v=4", width: 1200, height: 630, alt: "Hires - AI-Powered Hiring Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hires - AI-Powered Hiring Platform",
    description: "Smarter screening, candidate pipelines, career pages, and analytics.",
    images: ["/images/og-hires.png?v=4"],
  },
  alternates: { canonical: "/products" },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
