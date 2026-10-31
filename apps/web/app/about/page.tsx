import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon, BookIcon, GlobeIcon, HeadphonesIcon, HeartIcon } from "@/components/ui/icons";
import { getPage } from "@/lib/api";
import { pageParagraphs } from "@/lib/cms";

export const metadata: Metadata = {
  title: "About",
  description: "Why Lisbook exists and where it's headed."
};

const values = [
  {
    icon: <BookIcon size={22} />,
    title: "Stories for everyone",
    body: "Great books shouldn't sit behind a paywall. Every Lisbook title is free to stream."
  },
  {
    icon: <HeadphonesIcon size={22} />,
    title: "Listening first",
    body: "A calm, distraction-free player designed around chapters, focus and picking up where you left off."
  },
  {
    icon: <GlobeIcon size={22} />,
    title: "Open by design",
    body: "Built in the open by a community of contributors, with a public API that powers web and mobile alike."
  }
];

const milestones = [
  { title: "A university project", body: "Lisbook started as a small static site sharing a handful of favourite audiobooks." },
  { title: "A growing community", body: "Contributors from around the world added books, features and translations." },
  { title: "A full platform", body: "Today Lisbook is being rebuilt with a real catalog, accounts and an editorial CMS." },
  { title: "Next: Lisbook everywhere", body: "The same API will power a native mobile app so your library travels with you." }
];

export default async function AboutPage() {
  const page = await getPage("about");
  const intro = pageParagraphs(page?.content);

  return (
    <div className="shell">
      <header className="page-head">
        <span className="eyebrow">Our story</span>
        <h1>{page?.title ?? "About Lisbook"}</h1>
        <p>{intro[0] ?? "Lisbook makes timeless books easy to hear — free, beautifully simple and open to everyone."}</p>
      </header>

      <section className="split">
        <article className="glass glass--pad sheen stack" style={{ gap: 18 }}>
          <span className="eyebrow">Mission</span>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>Make every great book something you can press play on.</h2>
          <div className="prose stack" style={{ gap: 14 }}>
            {intro.slice(1).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            <p>
              We believe listening opens books to more people — commuters, multitaskers, language learners and anyone who
              simply loves a good story read aloud. Lisbook pairs a carefully curated catalog with a player that gets out of
              your way.
            </p>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <ButtonLink href="/explore" variant="primary">
              Start listening <ArrowRightIcon size={16} />
            </ButtonLink>
            <ButtonLink href="/contact" variant="glass">
              Get in touch
            </ButtonLink>
          </div>
        </article>

        <article className="glass glass--pad">
          <span className="eyebrow">The journey</span>
          <ol className="timeline" style={{ marginTop: 24 }}>
            {milestones.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">What we value</span>
            <h2 style={{ marginTop: 10 }}>Built around listeners</h2>
          </div>
        </div>
        <div className="grid grid--3">
          {values.map((value) => (
            <article key={value.title} className="feature glass glass--pad glass--interactive">
              <span className="feature__icon">{value.icon}</span>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta glass sheen">
        <span className="cta__orb" aria-hidden />
        <div>
          <span className="eyebrow">
            <HeartIcon size={14} /> Open source
          </span>
          <h2>Help shape what Lisbook becomes.</h2>
          <p className="muted">Suggest a book, report a bug or contribute code — every bit helps more people listen.</p>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <a className="btn btn--primary btn--lg" href="https://github.com/Ctoic" target="_blank" rel="noreferrer">
            Contribute on GitHub
          </a>
          <ButtonLink href="/contact" variant="glass" size="lg">
            Suggest a book
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
