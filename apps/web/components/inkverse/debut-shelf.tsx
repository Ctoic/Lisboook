"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ShelfBookContract, ShelfBookDetailContract } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, BookIcon, HeadphonesIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, QuillIcon } from "@/components/ui/icons";
import { formatWords, publicApi } from "@/lib/inkverse-client";
import { segmentChapter, useVoices, utterance, voiceFor } from "@/lib/hearth";
import { BookCover } from "./book-cover";
import { roleColor } from "./kinship-web";

/** The Debut Shelf: every Saga published from the Inkverse. */
export function DebutShelf() {
  const [books, setBooks] = useState<ShelfBookContract[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publicApi.shelf().then(setBooks, (err: Error) => setError(err.message));
  }, []);

  return (
    <div className="shell">
      <header className="page-head">
        <span className="eyebrow">The Debut Shelf</span>
        <h1>
          Inkverse <span className="gradient-text">Originals</span>
        </h1>
        <p>Stories written on Lisbook, by readers who became writers. Open any of them and Lis will read it to you.</p>
      </header>
      {error ? (
        <EmptyState icon={<AlertIcon size={28} />} title="The shelf is out of reach" description={error} />
      ) : !books ? (
        <div className="shelf">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "2 / 3", borderRadius: 18 }} />
          ))}
        </div>
      ) : !books.length ? (
        <EmptyState
          icon={<BookIcon size={28} />}
          title="The shelf is waiting for its first book"
          description="Finish a Saga and light the lantern in the Lantern Press to publish it here."
          actions={
            <ButtonLink href="/inkverse" variant="primary">
              <QuillIcon size={16} /> Start writing
            </ButtonLink>
          }
        />
      ) : (
        <div className="shelf">
          {books.map((book) => (
            <Link key={book.slug} href={`/inkverse/library/${book.slug}`} className="shelf__book">
              <BookCover title={book.title} author={book.author.quillName} styleIndex={book.coverStyle} />
              <h3>{book.title}</h3>
              <p className="muted">
                {book.author.quillName} · {book.chapterCount} {book.chapterCount === 1 ? "chapter" : "chapters"}
              </p>
              {book.tagline ? <p className="shelf__tagline">{book.tagline}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** One published book: read it, or let the Hearth read it aloud with a voice per character. */
export function BookReader({ slug }: { slug: string }) {
  const voices = useVoices();
  const [book, setBook] = useState<ShelfBookDetailContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [segment, setSegment] = useState(0);
  const [speed, setSpeed] = useState(1);
  const tokenRef = useRef(0);
  // Read at speak time, so changing speed mid-chapter applies to the very next line.
  const speedRef = useRef(1);
  const readerRef = useRef<HTMLDivElement>(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    publicApi.book(slug).then(setBook, (err: Error) => setError(err.message));
    return () => {
      tokenRef.current++;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [slug]);

  const parsed = useMemo(() => (book?.chapters[chapter] ? segmentChapter(book.chapters[chapter].content, book.souls) : null), [book, chapter]);

  const stop = useCallback(() => {
    tokenRef.current++;
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }, []);

  /** Speaks from a segment onward; each utterance hands over to the next until the chapter ends, then moves on. */
  const speakFrom = useCallback(
    (chapterIndex: number, from: number) => {
      if (!book || !("speechSynthesis" in window)) return;
      const token = ++tokenRef.current;
      window.speechSynthesis.cancel();
      const { segments } = segmentChapter(book.chapters[chapterIndex].content, book.souls);
      const step = (i: number) => {
        if (token !== tokenRef.current) return;
        if (i >= segments.length) {
          if (chapterIndex + 1 < book.chapters.length) {
            setChapter(chapterIndex + 1);
            setSegment(0);
            speakFrom(chapterIndex + 1, 0);
          } else setPlaying(false);
          return;
        }
        setSegment(i);
        const seg = segments[i];
        const u = utterance(seg.text, voiceFor(book.hearth, seg.soulId), voices, speedRef.current);
        u.onend = () => step(i + 1);
        u.onerror = () => token === tokenRef.current && setPlaying(false);
        window.speechSynthesis.speak(u);
      };
      setPlaying(true);
      step(from);
    },
    [book, voices]
  );

  // Keep the paragraph being read in view.
  useEffect(() => {
    if (!playing || !parsed) return;
    const paragraph = parsed.segments[segment]?.paragraph;
    readerRef.current?.querySelector(`[data-p="${paragraph}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [playing, segment, parsed]);

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="This book isn't on the shelf"
          description={error}
          actions={
            <ButtonLink href="/inkverse/library" variant="primary">
              Browse the Debut Shelf
            </ButtonLink>
          }
        />
      </div>
    );
  }
  if (!book || !parsed) {
    return (
      <div className="shell section" aria-busy="true">
        <div className="skeleton" style={{ height: 320, borderRadius: 26 }} />
      </div>
    );
  }

  const current = parsed.segments[segment];
  const speaker = current?.soulId ? book.souls.find((s) => s.id === current.soulId) : null;
  const activeParagraph = playing ? current?.paragraph : -1;

  function goChapter(index: number) {
    const wasPlaying = playing;
    stop();
    setChapter(index);
    setSegment(0);
    window.scrollTo({ top: readerRef.current ? readerRef.current.offsetTop - 120 : 0, behavior: "smooth" });
    if (wasPlaying) setTimeout(() => speakFrom(index, 0), 60);
  }

  return (
    <div className="reader-page">
      <div className="shell">
        <Link href="/inkverse/library" className="back-link">
          <ArrowLeftIcon size={16} /> The Debut Shelf
        </Link>
        <section className="reader-hero">
          <BookCover title={book.title} author={book.author.quillName} styleIndex={book.coverStyle} tagline={book.tagline} size="lg" />
          <div className="reader-hero__info">
            <span className="eyebrow">Inkverse Original{book.genre ? ` · ${book.genre}` : ""}</span>
            <h1>{book.title}</h1>
            <p className="reader-hero__by">
              by{" "}
              <Link href={`/creators/${encodeURIComponent(book.author.quillName)}`} className="text-accent">
                {book.author.quillName}
              </Link>{" "}
              · {book.chapterCount} {book.chapterCount === 1 ? "chapter" : "chapters"} · {formatWords(book.wordCount)}
            </p>
            {book.tagline ? <p className="reader-hero__tagline">{book.tagline}</p> : null}
            {book.blurb ? <p className="reader-hero__blurb">{book.blurb}</p> : null}
            <div className="row" style={{ gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              {supported ? (
                <Button variant="primary" size="lg" onClick={() => (playing ? stop() : speakFrom(chapter, segment))}>
                  {playing ? <PauseIcon size={18} /> : <HeadphonesIcon size={18} />} {playing ? "Pause Lis" : "Listen with Lis"}
                </Button>
              ) : null}
              <Button variant="glass" size="lg" onClick={() => readerRef.current?.scrollIntoView({ behavior: "smooth" })}>
                <BookIcon size={18} /> Start reading
              </Button>
            </div>
            {book.souls.length ? (
              <div className="reader-cast">
                <span className="muted">Voices:</span>
                <span className="reader-cast__name">Narrator</span>
                {book.souls.map((s) => (
                  <span key={s.id} className="reader-cast__name" title={s.summary ?? undefined}>
                    <span className="quill__cast-dot" style={{ background: roleColor[s.role] }} /> {s.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className="reader" ref={readerRef}>
          <nav className="reader__chapters" aria-label="Chapters">
            {book.chapters.map((c, i) => (
              <button key={c.id} type="button" className="ink-tab" aria-current={i === chapter ? "page" : undefined} onClick={() => goChapter(i)}>
                {i + 1}. {c.title}
              </button>
            ))}
          </nav>
          <article className="reader__text">
            <h2>{book.chapters[chapter].title}</h2>
            {parsed.paragraphs.map((p, i) => (
              <p key={i} data-p={i} className={i === activeParagraph ? "reader__active" : undefined} onDoubleClick={() => supported && speakFrom(chapter, parsed.segments.findIndex((s) => s.paragraph === i))}>
                {p}
              </p>
            ))}
            <div className="row" style={{ justifyContent: "space-between", marginTop: 28 }}>
              <Button variant="ghost" onClick={() => goChapter(chapter - 1)} disabled={chapter === 0}>
                <PrevIcon size={16} /> Previous chapter
              </Button>
              <Button variant="glass" onClick={() => goChapter(chapter + 1)} disabled={chapter >= book.chapters.length - 1}>
                Next chapter <NextIcon size={16} />
              </Button>
            </div>
          </article>
        </div>
      </div>

      {supported ? (
        <div className="hearth-bar glass glass--strong" role="region" aria-label="The Hearth">
          <Button variant="ghost" icon size="sm" onClick={() => goChapter(chapter - 1)} disabled={chapter === 0} aria-label="Previous chapter">
            <PrevIcon size={18} />
          </Button>
          <Button variant="primary" icon onClick={() => (playing ? stop() : speakFrom(chapter, segment))} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </Button>
          <Button variant="ghost" icon size="sm" onClick={() => goChapter(chapter + 1)} disabled={chapter >= book.chapters.length - 1} aria-label="Next chapter">
            <NextIcon size={18} />
          </Button>
          <div className="hearth-bar__now">
            <span className="hearth-bar__title">
              {book.title} · {book.chapters[chapter].title}
            </span>
            <span className="muted hearth-bar__speaker">
              {playing ? (
                speaker ? (
                  <>
                    <span className="quill__cast-dot" style={{ background: roleColor[speaker.role] }} /> {speaker.name} is speaking
                  </>
                ) : (
                  "Narrator"
                )
              ) : (
                "Lis is ready to read. Double-click any paragraph to start there."
              )}
            </span>
          </div>
          <div className="segmented hearth-bar__speed" role="group" aria-label="Reading speed">
            {[0.85, 1, 1.25].map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={speed === s}
                onClick={() => {
                  setSpeed(s);
                  speedRef.current = s;
                  if (playing) setTimeout(() => speakFrom(chapter, segment), 30);
                }}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
