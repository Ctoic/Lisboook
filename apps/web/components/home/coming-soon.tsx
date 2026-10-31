"use client";

import { useState, type CSSProperties, type PointerEvent } from "react";
import { Cover } from "@/components/ui/cover";
import { ClockIcon, SparkleIcon } from "@/components/ui/icons";
import { upcomingBooks, upcomingGenres, type UpcomingBook, type UpcomingGenre } from "@/lib/upcoming-books";
import { useToast } from "@/providers/toast-provider";

function useComingSoon() {
  const toast = useToast();
  return (book: UpcomingBook) =>
    toast({
      tone: "info",
      title: "Coming soon",
      description: `${book.title} is ${book.status.toLowerCase()} and will be added to Lisbook soon.`
    });
}

function tilt(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  el.style.setProperty("--rx", `${((0.5 - y) * 10).toFixed(2)}deg`);
  el.style.setProperty("--ry", `${((x - 0.5) * 12).toFixed(2)}deg`);
  el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
  el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
}

function resetTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--rx", "0deg");
  event.currentTarget.style.setProperty("--ry", "0deg");
}

export function ComingSoonCard({ book, index = 0 }: { book: UpcomingBook; index?: number }) {
  const notify = useComingSoon();
  return (
    <button
      type="button"
      className="soon-card"
      style={{ "--i": index } as CSSProperties}
      onClick={() => notify(book)}
      onPointerMove={tilt}
      onPointerLeave={resetTilt}
      aria-label={`${book.title} by ${book.author} — coming soon`}
    >
      <span className="soon-card__media">
        <Cover title={book.title} author={book.author} slug={book.slug} />
        <span className="soon-card__glare" aria-hidden />
        <span className="soon-card__ribbon">Coming soon</span>
      </span>
      <span className="soon-card__body">
        <span className="soon-card__title">{book.title}</span>
        <span className="soon-card__meta">{book.author}</span>
        <span className="soon-card__foot">
          <span className={`soon-card__status soon-card__status--${book.status.split(" ")[0].toLowerCase()}`}>{book.status}</span>
          <span className="row" style={{ gap: 4 }}>
            <ClockIcon size={13} /> {book.length}
          </span>
        </span>
      </span>
    </button>
  );
}

export function UpcomingShelves() {
  const [genre, setGenre] = useState<UpcomingGenre | "All">("All");
  const shelf = genre === "All" ? upcomingBooks.slice(0, 10) : upcomingBooks.filter((book) => book.genre === genre);

  return (
    <>
      <div className="chips soon-tabs" role="toolbar" aria-label="Filter upcoming audiobooks by genre">
        {(["All", ...upcomingGenres] as const).map((name) => (
          <button key={name} type="button" className="chip" aria-pressed={genre === name} onClick={() => setGenre(name)}>
            {name}
            <span className="chip__count">
              {name === "All" ? upcomingBooks.length : upcomingBooks.filter((book) => book.genre === name).length}
            </span>
          </button>
        ))}
      </div>
      <div key={genre} className="grid grid--books soon-grid">
        {shelf.map((book, i) => (
          <ComingSoonCard key={book.slug} book={book} index={i} />
        ))}
      </div>
    </>
  );
}

/** Two endlessly scrolling rows of upcoming covers. */
export function CoverMarquee() {
  const notify = useComingSoon();
  const half = Math.ceil(upcomingBooks.length / 2);
  const rows = [upcomingBooks.slice(0, half), upcomingBooks.slice(half)];

  return (
    <div className="marquee" aria-label="Audiobooks coming soon">
      {rows.map((row, r) => (
        <div key={r} className={`marquee__row${r ? " marquee__row--reverse" : ""}`}>
          {[0, 1].map((copy) => (
            <ul key={copy} className="marquee__track" aria-hidden={copy === 1 || undefined}>
              {row.map((book) => (
                <li key={book.slug}>
                  <button
                    type="button"
                    className="marquee__item"
                    tabIndex={copy ? -1 : undefined}
                    onClick={() => notify(book)}
                    aria-label={`${book.title} — coming soon`}
                  >
                    <Cover title={book.title} author={book.author} slug={book.slug} />
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
      ))}
      <p className="marquee__caption">
        <SparkleIcon size={14} /> {upcomingBooks.length} new audiobooks on the way. Tap a cover to peek.
      </p>
    </div>
  );
}
