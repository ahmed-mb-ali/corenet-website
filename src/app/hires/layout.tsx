import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hires - Smart Hiring Platform",
  description:
    "Hires by Corenet is an AI-powered hiring platform that helps companies in Saudi Arabia screen smarter, manage candidate pipelines, and hire faster — saving up to SR 8,500 per hire.",
  openGraph: {
    title: "Hires - Smart Hiring Platform by Corenet",
    description:
      "AI-powered hiring platform for companies in Saudi Arabia. Screen smarter, hire faster, save up to SR 8,500 per hire.",
    url: "https://www.corenet.sa/hires",
    images: [{ url: "/images/og-hires.png", width: 1200, height: 630, alt: "Hires by Corenet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hires - Smart Hiring Platform by Corenet",
    description: "AI-powered hiring for Saudi Arabia. Screen smarter, hire faster.",
    images: ["/images/og-hires.png"],
  },
  alternates: { canonical: "/hires" },
};

export default function HiresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
