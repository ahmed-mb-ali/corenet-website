import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talk to Sales",
  description:
    "Get a personalized demo of Corenet's AI-powered hiring platform. See how companies across Saudi Arabia save up to SR 8,500 per hire with smarter recruitment.",
  openGraph: {
    title: "Talk to Sales | Corenet",
    description:
      "Get a personalized demo of Corenet's AI-powered hiring platform. See how companies save up to SR 8,500 per hire.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
  },
};

export default function TalkToSalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
