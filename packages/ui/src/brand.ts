import type { BrandPalette, LegacyReferencePage } from "@lisbook/types";

export const lisbookPalette: BrandPalette = {
  background: "#121212",
  surface: "#1f2937",
  accent: "#94d769",
  text: "#f3f4f6",
  muted: "#9ca3af"
};

export const legacyReferencePages: LegacyReferencePage[] = [
  { slug: "home", sourcePath: "/index.html", label: "Home" },
  { slug: "explore", sourcePath: "/explore.html", label: "Explore" },
  { slug: "about", sourcePath: "/about.html", label: "About" },
  { slug: "contact", sourcePath: "/contact.html", label: "Contact" },
  { slug: "faq", sourcePath: "/faq.html", label: "FAQ" },
  { slug: "profile", sourcePath: "/profile.html", label: "Profile" },
  { slug: "scan", sourcePath: "/scan.html", label: "Scan" }
];

export const lisbookTagline =
  "Listen to books through a branded, modern platform built from the original Lisbook experience.";

