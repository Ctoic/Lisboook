import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/footer";
import { MiniPlayer } from "@/components/mini-player";
import { Navbar } from "@/components/navbar";
import { AppProviders } from "@/providers/app-providers";
import { themeInitScript } from "@/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lisbook — Free audiobooks for curious minds",
    template: "%s · Lisbook"
  },
  description: "Stream classic literature, science and big ideas as beautifully narrated audiobooks. Free, on any device.",
  icons: { icon: "/images/favicon.jpg" }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#06080a" },
    { media: "(prefers-color-scheme: light)", color: "#eef3ec" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <div className="ambient" aria-hidden>
          <span className="ambient__blob ambient__blob--1" />
          <span className="ambient__blob ambient__blob--2" />
          <span className="ambient__blob ambient__blob--3" />
        </div>
        <AppProviders>
          <Navbar />
          <main id="content">{children}</main>
          <Footer />
          <MiniPlayer />
        </AppProviders>
      </body>
    </html>
  );
}
