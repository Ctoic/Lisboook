"use client";

import Link from "next/link";
import { useState } from "react";
import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { HeadphonesIcon, HeartIcon, InfoIcon, LogOutIcon, PlayIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { formatClock, initials } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { useLibrary } from "@/providers/library-provider";
import { playbackRates, usePlayer } from "@/providers/player-provider";
import { useTheme } from "@/providers/theme-provider";
import { useToast } from "@/providers/toast-provider";

type Tab = "listening" | "favorites" | "preferences";

const tabs: { id: Tab; label: string }[] = [
  { id: "listening", label: "Continue listening" },
  { id: "favorites", label: "Favorites" },
  { id: "preferences", label: "Preferences" }
];

function ContinueListening() {
  const { recent, clearHistory } = useLibrary();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();

  if (!recent.length) {
    return (
      <EmptyState
        icon={<HeadphonesIcon size={28} />}
        title="Nothing in progress"
        description="Start any audiobook and it will show up here, ready to resume exactly where you stopped."
        actions={
          <ButtonLink href="/explore" variant="primary">
            Find something to hear
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="stack">
      {recent.map((entry) => {
        const pct = entry.duration ? Math.min(100, Math.round((entry.position / entry.duration) * 100)) : 0;
        return (
          <article key={entry.book.id} className="progress-row glass glass--interactive">
            <Link href={`/books/${entry.book.slug}`} aria-label={`Open ${entry.book.title}`}>
              <Cover title={entry.book.title} author={entry.book.authorName} slug={entry.book.slug} coverUrl={entry.book.coverUrl} />
            </Link>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: "1.15rem" }}>
                <Link href={`/books/${entry.book.slug}`}>{entry.book.title}</Link>
              </h3>
              <p className="muted" style={{ fontSize: "0.88rem" }}>
                Chapter {entry.chapterNumber} · {entry.chapterTitle} · {formatClock(entry.position)} / {formatClock(entry.duration)}
              </p>
              <div className="meter" aria-label={`${pct}% of chapter listened`}>
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>
            <ButtonLink href={`/books/${entry.book.slug}`} variant="glass" size="sm">
              <PlayIcon size={14} /> Resume
            </ButtonLink>
          </article>
        );
      })}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
          Clear listening history
        </Button>
      </div>
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        icon={<InfoIcon size={24} />}
        title="Clear listening history?"
        description="Your saved positions on this device will be removed. Favorites are kept."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} data-autofocus>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearHistory();
                setConfirmOpen(false);
                toast({ title: "Listening history cleared" });
              }}
            >
              Clear history
            </Button>
          </>
        }
      />
    </div>
  );
}

function Favorites() {
  const { favorites } = useLibrary();
  if (!favorites.length) {
    return (
      <EmptyState
        icon={<HeartIcon size={28} />}
        title="No favorites yet"
        description="Tap the heart on any audiobook to keep it here for later."
        actions={
          <ButtonLink href="/explore" variant="primary">
            Browse the catalog
          </ButtonLink>
        }
      />
    );
  }
  return (
    <div className="grid grid--books">
      {favorites.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

function Preferences() {
  const { theme, setTheme } = useTheme();
  const { rate, setRate } = usePlayer();
  return (
    <div className="glass glass--pad">
      <div className="pref">
        <div>
          <h3>Appearance</h3>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Choose how Lisbook looks on this device.
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Theme">
          {(["dark", "light"] as const).map((mode) => (
            <button key={mode} type="button" aria-pressed={theme === mode} onClick={() => setTheme(mode)}>
              {mode === "dark" ? "Dark" : "Light"}
            </button>
          ))}
        </div>
      </div>
      <div className="pref">
        <div>
          <h3>Playback speed</h3>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            Default speed for every chapter you play.
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Playback speed">
          {playbackRates.map((value) => (
            <button key={value} type="button" aria-pressed={rate === value} onClick={() => setRate(value)}>
              {value}×
            </button>
          ))}
        </div>
      </div>
      <div className="pref">
        <div>
          <h3>Language</h3>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            More languages are on the way.
          </p>
        </div>
        <span className="badge">English</span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { session, ready, openSignIn, signOut } = useAuth();
  const { favorites, recent } = useLibrary();
  const [tab, setTab] = useState<Tab>("listening");

  if (!ready) {
    return (
      <div className="shell">
        <div className="skeleton" style={{ height: 150, marginTop: 32, borderRadius: 34 }} />
        <div className="skeleton" style={{ height: 50, width: 380, maxWidth: "100%", margin: "28px 0", borderRadius: 999 }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 26 }} />
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="shell">
      <header className="profile-head glass sheen">
        <span className="avatar avatar--lg">{user ? initials(user.displayName) : <HeadphonesIcon size={34} />}</span>
        <div>
          <span className="eyebrow">Your library</span>
          <h1 style={{ margin: "8px 0 4px" }}>{user ? user.displayName : "Guest listener"}</h1>
          <p className="muted">
            {user ? user.email : "Not signed in"} · {favorites.length} saved · {recent.length} in progress
          </p>
        </div>
        <div className="profile-head__actions">
          {user ? (
            <Button variant="glass" onClick={signOut}>
              <LogOutIcon size={18} /> Sign out
            </Button>
          ) : (
            <Button variant="primary" onClick={() => openSignIn()}>
              Sign in
            </Button>
          )}
        </div>
      </header>

      <div className="tabs glass" role="tablist" aria-label="Library sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              const index = tabs.findIndex((t) => t.id === tab);
              const next = tabs[(index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
              setTab(next.id);
              document.getElementById(`tab-${next.id}`)?.focus();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "listening" ? <ContinueListening /> : tab === "favorites" ? <Favorites /> : <Preferences />}
      </section>

      <p className="field__hint row" style={{ gap: 8, marginTop: 24 }}>
        <InfoIcon size={15} /> Favorites and listening progress are saved on this device.
      </p>
    </div>
  );
}
