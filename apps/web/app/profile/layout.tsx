import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your library",
  description: "Favorites, listening progress and preferences."
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
