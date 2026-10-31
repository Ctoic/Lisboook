import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator",
  description: "An Inkverse creator's books, rank and Campfire posts."
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
