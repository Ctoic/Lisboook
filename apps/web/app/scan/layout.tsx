import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan a book cover",
  description: "Find an audiobook from a photo of its printed cover."
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
