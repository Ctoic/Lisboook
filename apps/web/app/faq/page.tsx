import type { Metadata } from "next";
import { UnavailableState } from "@/components/states";
import { ButtonLink } from "@/components/ui/button";
import { MailIcon } from "@/components/ui/icons";
import { getFaqs } from "@/lib/api";
import { FaqList } from "./faq-list";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about listening on Lisbook."
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <div className="shell" style={{ maxWidth: 860 }}>
      <header className="page-head" style={{ textAlign: "center" }}>
        <span className="eyebrow">Help centre</span>
        <h1>Frequently asked questions</h1>
        <p style={{ marginInline: "auto" }}>Everything you need to know about listening on Lisbook.</p>
      </header>

      {faqs.data ? <FaqList faqs={faqs.data} /> : <UnavailableState retryHref="/faq" />}

      <section className="glass glass--pad sheen" style={{ marginTop: 40, textAlign: "center" }}>
        <h2 style={{ fontSize: "1.6rem" }}>Still have a question?</h2>
        <p className="muted" style={{ margin: "8px auto 20px", maxWidth: 420 }}>
          Can&apos;t find what you&apos;re looking for? Our team is happy to help.
        </p>
        <ButtonLink href="/contact" variant="primary">
          <MailIcon size={18} /> Contact us
        </ButtonLink>
      </section>
    </div>
  );
}
