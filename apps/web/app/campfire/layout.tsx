import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Campfire",
  description: "Share wild story ideas, argue the big questions of craft, and write tales together."
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
