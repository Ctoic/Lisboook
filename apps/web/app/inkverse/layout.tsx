import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inkverse",
  description: "Write your own stories with Lis, your Muse: Sagas, chapters and a writing studio."
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
