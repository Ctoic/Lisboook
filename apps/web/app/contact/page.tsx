import type { Metadata } from "next";
import { GithubIcon, MailIcon, XBrandIcon } from "@/components/ui/icons";
import { getPage } from "@/lib/api";
import { pageParagraphs } from "@/lib/cms";
import { CONTACT_EMAIL } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions, feedback or partnership ideas — reach the Lisbook team."
};

const channels = [
  { icon: <MailIcon size={20} />, label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: <GithubIcon size={20} />, label: "GitHub", value: "github.com/Ctoic", href: "https://github.com/Ctoic" },
  { icon: <XBrandIcon size={18} />, label: "X / Twitter", value: "@Ct0ic", href: "https://x.com/Ct0ic" }
];

export default async function ContactPage() {
  const page = await getPage("contact");
  const [intro] = pageParagraphs(page?.content);

  return (
    <div className="shell">
      <header className="page-head">
        <span className="eyebrow">Say hello</span>
        <h1>{page?.title === "Contact" || !page ? "Get in touch" : page.title}</h1>
        <p>{intro ?? "Reach the Lisbook team for feedback, support and partnership enquiries."}</p>
      </header>

      <div className="split split--contact">
        <aside className="stack">
          {channels.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              className="contact-item glass glass--interactive"
              target={channel.href.startsWith("http") ? "_blank" : undefined}
              rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
            >
              <span className="feature__icon">{channel.icon}</span>
              <span>
                <small>{channel.label}</small>
                <strong style={{ fontWeight: 600 }}>{channel.value}</strong>
              </span>
            </a>
          ))}
          <div className="glass glass--pad">
            <h2 style={{ fontSize: "1.25rem", marginBottom: 8 }}>Response times</h2>
            <p className="muted">We&apos;re a small volunteer team and usually reply within two working days.</p>
          </div>
        </aside>

        <ContactForm />
      </div>
    </div>
  );
}
