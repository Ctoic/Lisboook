import Link from "next/link";
import { GithubIcon, XBrandIcon } from "@/components/ui/icons";
import { Brand } from "./navbar";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  {
    title: "Listen",
    links: [
      { href: "/explore", label: "Explore catalog" },
      { href: "/scan", label: "Scan a cover" },
      { href: "/profile", label: "Your library" }
    ]
  },
  {
    title: "Lisbook",
    links: [
      { href: "/about", label: "About us" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" }
    ]
  },
  {
    title: "Community",
    links: [
      { href: "https://github.com/Ctoic", label: "GitHub", external: true },
      { href: "https://x.com/Ct0ic", label: "X / Twitter", external: true }
    ]
  }
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__panel glass sheen">
          <div className="stack" style={{ gap: 18 }}>
            <Brand />
            <p className="muted" style={{ maxWidth: 340 }}>
              Free audiobooks for curious minds. Press play on classics, science and big ideas, wherever you are.
            </p>
            <NewsletterForm source="footer" compact />
          </div>
          {columns.map((column) => (
            <div key={column.title} className="footer__col">
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link ? (
                      <a href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Lisbook. Made for listeners.</span>
          <span className="row" style={{ gap: 6 }}>
            <a className="btn btn--ghost btn--icon btn--sm" href="https://github.com/Ctoic" target="_blank" rel="noreferrer" aria-label="Lisbook on GitHub">
              <GithubIcon size={17} />
            </a>
            <a className="btn btn--ghost btn--icon btn--sm" href="https://x.com/Ct0ic" target="_blank" rel="noreferrer" aria-label="Lisbook on X">
              <XBrandIcon size={15} />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
