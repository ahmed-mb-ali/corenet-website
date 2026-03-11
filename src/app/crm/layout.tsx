import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corenet CRM",
  description: "Corenet CRM Admin",
  robots: "noindex, nofollow",
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return children;
}
