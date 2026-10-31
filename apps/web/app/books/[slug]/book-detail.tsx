"use client";

import { useState } from "react";
import type { AudiobookDetailContract } from "@lisbook/types";
import { ShareModal } from "@/components/share-modal";
import { Button } from "@/components/ui/button";
import { Cover, coverGradient } from "@/components/ui/cover";
import { ClockIcon, GlobeIcon, HeadphonesIcon, HeartIcon, InfoIcon, LayersIcon, PauseIcon, PlayIcon, ShareIcon, SparkleIcon } from "@/components/ui/icons";
import { formatClock, formatDuration, formatLanguage, plural } from "@/lib/format";
import { useAssistant } from "@/providers/assistant-provider";
import { toSnapshot, useLibrary } from "@/providers/library-provider";
import { hasAudio, usePlayer } from "@/providers/player-provider";
import { useToast } from "@/providers/toast-provider";

export function BookDetail({ book }: { book: AudiobookDetailContract }) {
  const { isFavorite, toggleFavorite, progress, latestForBook } = useLibrary();
  const player = usePlayer();
  const toast = useToast();
  const { openAssistant } = useAssistant();
  const [shareOpen, setShareOpen] = useState(false);

  const snapshot = toSnapshot(book);
  const saved = isFavorite(book.id);
  const chapters = book.chapters;
  const playable = chapters.filter(hasAudio);
  const resume = latestForBook(book.id);
  const resumeIndex = resume ? chapters.findIndex((chapter) => chapter.id === resume.chapterId) : -1;
  const isThisBook = player.current?.book.id === book.id;
  const totalDuration = book.totalDurationSeconds || chapters.reduce((sum, chapter) => sum + chapter.durationSeconds, 0);
  const paragraphs = book.description.split(/\n{2,}/).filter(Boolean);

  function playFrom(index: number) {
    if (isThisBook && player.current?.index === index) {
      player.toggle();
      return;
    }
    player.play(snapshot, chapters, index);
  }

  function onPrimary() {
    if (isThisBook) return player.toggle();
    if (!playable.length) {
      toast({ tone: "info", title: "Audio coming soon", description: `${book.title} is being prepared for listening. Save it to get back here quickly.` });
      return;
    }
    const start = resumeIndex >= 0 && hasAudio(chapters[resumeIndex]) ? resumeIndex : chapters.findIndex(hasAudio);
    player.play(snapshot, chapters, start);
  }

  const primaryLabel = isThisBook ? (player.isPlaying ? "Pause" : "Resume") : resumeIndex >= 0 && playable.length ? "Resume listening" : "Start listening";

  return (
    <>
      <section className="book-hero glass sheen">
        <span className="book-hero__backdrop" style={{ background: coverGradient(book.slug) }} aria-hidden />
        <div className="cover-wrap">
          <Cover title={book.title} author={book.authorName} slug={book.slug} coverUrl={book.coverUrl} />
        </div>
        <div>
          <div className="book-hero__badges">
            {book.isFeatured ? <span className="badge badge--accent">Featured</span> : null}
            {book.categoryName ? (
              <span className="badge">
                <LayersIcon size={14} /> {book.categoryName}
              </span>
            ) : null}
            <span className="badge">
              <ClockIcon size={14} /> {formatDuration(totalDuration)}
            </span>
            <span className="badge">
              <GlobeIcon size={14} /> {formatLanguage(book.language)}
            </span>
          </div>
          <h1>{book.title}</h1>
          <p className="book-hero__byline">
            by <strong>{book.authorName}</strong>
            {book.narratorName ? (
              <>
                {" "}
                · narrated by <strong>{book.narratorName}</strong>
              </>
            ) : null}
          </p>
          <div className="book-hero__actions">
            <Button variant="primary" size="lg" onClick={onPrimary}>
              {isThisBook && player.isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              {primaryLabel}
            </Button>
            <Button
              variant="glass"
              size="lg"
              icon
              active={saved}
              aria-pressed={saved}
              aria-label={saved ? "Remove from favorites" : "Save to favorites"}
              title={saved ? "Remove from favorites" : "Save to favorites"}
              onClick={() => {
                const added = toggleFavorite(snapshot);
                toast({ title: added ? "Saved to your library" : "Removed from your library", description: book.title });
              }}
            >
              <HeartIcon size={20} filled={saved} />
            </Button>
            <Button variant="glass" size="lg" onClick={() => openAssistant(snapshot)}>
              <SparkleIcon size={18} /> Ask about this book
            </Button>
            <Button variant="glass" size="lg" icon onClick={() => setShareOpen(true)} aria-label="Share" title="Share">
              <ShareIcon size={18} />
            </Button>
          </div>
          {resume && resumeIndex >= 0 ? (
            <p className="book-hero__resume">
              You stopped at {formatClock(resume.position)} in chapter {resume.chapterNumber}, “{resume.chapterTitle}”.
            </p>
          ) : !playable.length && chapters.length ? (
            <p className="book-hero__resume row" style={{ gap: 8 }}>
              <InfoIcon size={16} /> Audio for this title is being prepared — it will be playable here soon.
            </p>
          ) : null}
        </div>
      </section>

      <div className="book-layout">
        <div className="stack" style={{ gap: 24 }}>
          <section className="glass glass--pad" aria-labelledby="about-book">
            <div className="panel-title">
              <h2 id="about-book">About this audiobook</h2>
            </div>
            <div className="prose">
              {paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="glass glass--pad" aria-labelledby="chapters-title">
            <div className="panel-title">
              <h2 id="chapters-title">Chapters</h2>
              <span className="badge">{plural(chapters.length, "chapter")}</span>
            </div>
            {chapters.length ? (
              <ol className="chapters">
                {chapters.map((chapter, index) => {
                  const active = isThisBook && player.chapter?.id === chapter.id;
                  const saved = progress[chapter.id];
                  const available = hasAudio(chapter);
                  const pct = saved && saved.duration ? Math.min(100, (saved.position / saved.duration) * 100) : 0;
                  return (
                    <li key={chapter.id} className={`chapter${active ? " chapter--active" : ""}`}>
                      <span className="chapter__num">{active && player.isPlaying ? <HeadphonesIcon size={18} /> : chapter.chapterNumber}</span>
                      <div style={{ minWidth: 0 }}>
                        <p className="chapter__title">{chapter.title}</p>
                        <div className="chapter__meta">
                          <span>{formatDuration(chapter.durationSeconds)}</span>
                          {chapter.isPreview ? <span className="badge badge--accent" style={{ height: 22, fontSize: "0.7rem" }}>Preview</span> : null}
                          {!available ? <span>· Audio coming soon</span> : null}
                        </div>
                        {pct > 0 ? (
                          <div className="chapter__progress" aria-label={`${Math.round(pct)}% listened`}>
                            <span style={{ width: `${pct}%` }} />
                          </div>
                        ) : null}
                      </div>
                      <Button
                        variant={active ? "primary" : "glass"}
                        icon
                        size="sm"
                        onClick={() => playFrom(index)}
                        aria-disabled={!available}
                        aria-label={active && player.isPlaying ? `Pause ${chapter.title}` : `Play ${chapter.title}`}
                      >
                        {active && player.isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
                      </Button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="muted">Chapters for this title will appear here once they're published.</p>
            )}
          </section>
        </div>

        <aside className="glass glass--pad" aria-labelledby="details-title" style={{ position: "sticky", top: "calc(var(--nav-h) + 24px)" }}>
          <div className="panel-title">
            <h2 id="details-title">Details</h2>
          </div>
          <dl className="details">
            <div>
              <dt>Author</dt>
              <dd>{book.authorName}</dd>
            </div>
            {book.narratorName ? (
              <div>
                <dt>Narrator</dt>
                <dd>{book.narratorName}</dd>
              </div>
            ) : null}
            {book.categoryName ? (
              <div>
                <dt>Category</dt>
                <dd>{book.categoryName}</dd>
              </div>
            ) : null}
            <div>
              <dt>Language</dt>
              <dd>{formatLanguage(book.language)}</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>{formatDuration(totalDuration)}</dd>
            </div>
            <div>
              <dt>Chapters</dt>
              <dd>{chapters.length}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd className="text-accent">Free</dd>
            </div>
          </dl>
        </aside>
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} title={book.title} author={book.authorName} path={`/books/${book.slug}`} />
    </>
  );
}
