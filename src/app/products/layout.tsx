import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore Corenet's AI-powered hiring products. Smarter screening, candidate pipelines, career pages, and analytics — built for companies in Saudi Arabia and the MENA region.",
  openGraph: {
    title: "Corenet Products - AI-Powered Hiring Platform",
    description:
      "Smarter screening, candidate pipelines, career pages, and analytics — built for companies in Saudi Arabia.",
    url: "https://www.corenet.sa/products",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Corenet Products" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Corenet Products - AI-Powered Hiring Platform",
    description: "Smarter screening, candidate pipelines, career pages, and analytics.",
    images: ["/images/og-image.png"],
  },
  alternates: { canonical: "/products" },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
