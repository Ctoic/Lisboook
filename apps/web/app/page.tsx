import Link from "next/link";
import type { AudiobookListItemContract } from "@lisbook/types";
import { BookCard } from "@/components/book-card";
import { CoverMarquee, UpcomingShelves } from "@/components/home/coming-soon";
import { CountUp, ParallaxStage, RevealObserver, RotatingWord } from "@/components/home/motion";
import { NewsletterForm } from "@/components/newsletter-form";
import { UnavailableState } from "@/components/states";
import { ButtonLink } from "@/components/ui/button";
import { Cover, coverGradient } from "@/components/ui/cover";
import {
  ArrowRightIcon,
  BookIcon,
  HeadphonesIcon,
  LayersIcon,
  PlayIcon,
  ScanIcon,
  SearchIcon,
  SparkleIcon
} from "@/components/ui/icons";
import { getCatalog } from "@/lib/api";
import { formatCompactDuration, plural } from "@/lib/format";
import { revealDelay } from "@/lib/reveal";
import { upcomingBooks } from "@/lib/upcoming-books";

const steps = [
  {
    title: "Find your next listen",
    body: "Search by title or author, browse by category, or scan a printed cover to jump straight in."
  },
  {
    title: "Press play anywhere",
    body: "Chapters stream instantly with speed control, 15-second rewinds and lock-screen controls."
  },
  {
    title: "Pick up where you left off",
    body: "Your place in every chapter is remembered, so the next session starts exactly where you stopped."
  }
];

function HeroStage({ books }: { books: AudiobookListItemContract[] }) {
  const [a, b, c] = books;
  const spotlight = c ?? a;
  // Until the catalog has three titles, fill the stack with upcoming covers.
  const stack = [0, 1, 2].map((i) => {
    const book = books[i];
    if (book) return { key: book.id, title: book.title, author: book.authorName, slug: book.slug, coverUrl: book.coverUrl };
    const soon = upcomingBooks[i * 5];
    return { key: soon.slug, title: soon.title, author: soon.author, slug: soon.slug, coverUrl: null };
  });
  return (
    <ParallaxStage className="hero__stage">
      <span className="hero__halo" aria-hidden />
      <span className="hero__spark hero__spark--1" aria-hidden />
      <span className="hero__spark hero__spark--2" aria-hidden />
      <span className="hero__spark hero__spark--3" aria-hidden />
      <div className="hero__stack" aria-hidden>
        {stack.map((book, i) => (
          <div key={book.key} className={`hero__book hero__book--${i + 1}`}>
            <div className="hero__book-inner">
              <Cover title={book.title} author={book.author} slug={book.slug} coverUrl={book.coverUrl} />
            </div>
          </div>
        ))}
      </div>
      {spotlight ? (
        <Link href={`/books/${spotlight.slug}`} className="now-card glass glass--strong glass--interactive">
          <div className="now-card__thumb">
            <Cover title={spotlight.title} author={spotlight.authorName} slug={spotlight.slug} coverUrl={spotlight.coverUrl} />
          </div>
          <div className="now-card__info">
            <p className="now-card__label">Featured listen</p>
            <p className="now-card__title">{spotlight.title}</p>
            <div className="wave" aria-hidden>
              {Array.from({ length: 22 }, (_, i) => (
                <span key={i} style={{ animationDuration: `${0.9 + (i % 5) * 0.18}s` }} />
              ))}
            </div>
          </div>
          <span className="btn btn--primary btn--icon" aria-hidden>
            <PlayIcon size={18} />
          </span>
        </Link>
      ) : null}
    </ParallaxStage>
  );
}

function categoriesOf(books: AudiobookListItemContract[]) {
  const counts = new Map<string, number>();
  for (const book of books) {
    if (book.categoryName) counts.set(book.categoryName, (counts.get(book.categoryName) ?? 0) + 1);
  }
  return [...counts.entries()].sort((x, y) => y[1] - x[1]);
}

export default async function HomePage() {
  const catalog = await getCatalog();
  const books = catalog.data ?? [];
  const featured = books.filter((book) => book.isFeatured);
  const spotlight = (featured.length >= 3 ? featured : books).slice(0, 3);
  const categories = categoriesOf(books);
  const authors = new Set(books.map((book) => book.authorName)).size;
  const totalSeconds = books.reduce((sum, book) => sum + book.totalDurationSeconds, 0);

  return (
    <>
      <RevealObserver />
      <section className="shell hero">
        <div className="hero__intro">
          <span className="eyebrow">Free audiobooks · No ads</span>
          <h1>
            Stories that move <RotatingWord words={["with you.", "your mind.", "your mornings.", "the world."]} />
          </h1>
          <p className="hero__lead">
            Lisbook turns timeless books and big ideas into beautifully simple listening. Press play on your commute, your
            walk, or your wind-down.
          </p>
          <form action="/explore" className="search-capsule glass glass--strong" role="search">
            <SearchIcon size={20} />
            <label htmlFor="hero-search" className="sr-only">
              Search audiobooks
            </label>
            <input id="hero-search" name="q" type="search" placeholder="Search titles, authors or narrators" autoComplete="off" />
            <button type="submit" className="btn btn--primary">
              Search
            </button>
          </form>
          <div className="hero__actions">
            <ButtonLink href="/explore" variant="glass">
              <BookIcon size={18} /> Browse the catalog
            </ButtonLink>
            <ButtonLink href="/scan" variant="ghost">
              <ScanIcon size={18} /> Scan a book cover
            </ButtonLink>
          </div>
        </div>
        <HeroStage books={spotlight} />
      </section>

      <section className="section--tight marquee-section" data-reveal>
        <CoverMarquee />
      </section>

      {catalog.error ? (
        <section className="shell section">
          <UnavailableState retryHref="/" />
        </section>
      ) : (
        <>
          <section className="shell section--tight">
            <div className="stats glass" aria-label="Library at a glance" data-reveal>
              <div className="stat">
                <p className="stat__value">
                  <CountUp value={books.length} />
                </p>
                <p className="stat__label">{books.length === 1 ? "Audiobook" : "Audiobooks"}</p>
              </div>
              <div className="stat">
                <p className="stat__value">{formatCompactDuration(totalSeconds)}</p>
                <p className="stat__label">Of listening</p>
              </div>
              <div className="stat">
                <p className="stat__value">
                  <CountUp value={authors} />
                </p>
                <p className="stat__label">{authors === 1 ? "Author" : "Authors"}</p>
              </div>
              <div className="stat">
                <p className="stat__value">
                  <CountUp value={100} />%
                </p>
                <p className="stat__label">Free to listen</p>
              </div>
            </div>
          </section>

          <section className="shell section" data-reveal>
            <div className="section-head">
              <div>
                <span className="eyebrow">Hand-picked</span>
                <h2 style={{ marginTop: 10 }}>Featured audiobooks</h2>
                <p>Our editors’ favourite listens right now.</p>
              </div>
              <ButtonLink href="/explore" variant="glass" size="sm">
                View all <ArrowRightIcon size={16} />
              </ButtonLink>
            </div>
            {books.length ? (
              <div className="rail">
                {(featured.length ? featured : books).map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <p className="muted">New titles are being prepared. Check back soon.</p>
            )}
          </section>

          {categories.length ? (
            <section className="shell section" data-reveal>
              <div className="section-head">
                <div>
                  <span className="eyebrow">Browse</span>
                  <h2 style={{ marginTop: 10 }}>Explore by category</h2>
                </div>
              </div>
              <div className="grid grid--3">
                {categories.map(([name, count], i) => (
                  <Link key={name} href={`/explore?category=${encodeURIComponent(name)}`} className="tile glass glass--interactive" data-reveal style={revealDelay(i)}>
                    <span className="tile__glow" style={{ background: coverGradient(name.toLowerCase()) }} />
                    <span className="tile__icon">
                      <LayersIcon size={22} />
                    </span>
                    <div>
                      <h3>{name}</h3>
                      <p className="muted" style={{ marginTop: 4 }}>
                        {plural(count, "title")}
                      </p>
                    </div>
                    <ArrowRightIcon size={20} className="tile__arrow" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <section className="shell section soon-section" id="coming-soon" data-reveal>
        <span className="soon-section__glow" aria-hidden />
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <SparkleIcon size={14} /> In the studio
            </span>
            <h2 style={{ marginTop: 10 }}>Coming soon to Lisbook</h2>
            <p>Our narrators are recording these right now. Pick a genre, tap a book, and see what&apos;s next.</p>
          </div>
        </div>
        <UpcomingShelves />
      </section>

      <section className="shell section" id="how-it-works">
        <div className="section-head">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 style={{ marginTop: 10 }}>Listening, made effortless</h2>
          </div>
        </div>
        <div className="grid grid--3">
          {steps.map((step, i) => (
            <article key={step.title} className="step glass glass--pad sheen" data-reveal style={revealDelay(i, 120)}>
              <span className="step__num">{i + 1}</span>
              <h3>{step.title}</h3>
              <p className="muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section">
        <div className="cta glass sheen" data-reveal>
          <span className="cta__orb" aria-hidden />
          <div>
            <span className="eyebrow">
              <SparkleIcon size={14} /> Release notes
            </span>
            <h2>New stories, straight to your inbox.</h2>
            <p className="muted">One short email when new audiobooks land. No spam, unsubscribe anytime.</p>
          </div>
          <div className="stack">
            <NewsletterForm source="home" />
            <p className="field__hint row" style={{ gap: 8 }}>
              <HeadphonesIcon size={16} /> We only write when there&apos;s something new worth hearing.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
