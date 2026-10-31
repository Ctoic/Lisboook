"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CreatorPageContract, InkRankContract } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui/button";
import { AlertIcon, CheckIcon, LockIcon } from "@/components/ui/icons";
import { formatWords, publicApi } from "@/lib/inkverse-client";
import { useAuth } from "@/providers/auth-provider";
import { BookCover } from "./book-cover";
import { postKinds } from "./campfire";
import { timeAgo } from "./inkwell";

/** Rank, progress to the next rank, streak and the headline numbers. */
export function RankCard({ ranks, compact = false }: { ranks: InkRankContract; compact?: boolean }) {
  const prev = ranks.nextAt === null ? 1 : ranks.nextAt;
  const pct = ranks.nextAt === null ? 100 : Math.min(100, Math.round((ranks.points / prev) * 100));
  return (
    <div className={`rank-card glass glass--pad${compact ? " rank-card--compact" : ""}`}>
      <div className="rank-card__head">
        <span className="rank-card__sigil" aria-hidden>
          {ranks.rank.slice(0, 1)}
        </span>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>
            Ink Rank
          </p>
          <p className="rank-card__rank">{ranks.rank}</p>
        </div>
        <div className="rank-card__streak" title="Days in a row with writing">
          <strong>{ranks.streakDays}</strong>
          <span className="muted">day streak</span>
        </div>
      </div>
      <div className="meter" aria-label={`${ranks.points} ink points`}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="muted rank-card__next">
        {ranks.points} ink · {ranks.nextRank ? `${(ranks.nextAt ?? 0) - ranks.points} more to ${ranks.nextRank}` : "The highest rank of all"}
      </p>
      {!compact ? (
        <div className="rank-card__stats">
          <span>
            <strong>{ranks.stats.words.toLocaleString()}</strong> words
          </span>
          <span>
            <strong>{ranks.stats.published}</strong> published
          </span>
          <span>
            <strong>{ranks.stats.souls}</strong> Souls
          </span>
          <span>
            <strong>{ranks.stats.embersReceived}</strong> Embers
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function Badges({ ranks }: { ranks: InkRankContract }) {
  return (
    <ul className="badges">
      {ranks.badges.map((b) => (
        <li key={b.id} className={`badge-tile glass${b.earned ? " badge-tile--earned" : ""}`} title={b.description}>
          <span className="badge-tile__icon">{b.earned ? <CheckIcon size={16} /> : <LockIcon size={14} />}</span>
          <span>
            <strong>{b.name}</strong>
            <span className="muted">{b.description}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A creator's public page: rank, badges, published books and Campfire posts. */
export function CreatorPage({ quillName }: { quillName: string }) {
  const { session, ready } = useAuth();
  const [page, setPage] = useState<CreatorPageContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    publicApi.creator(quillName, session?.accessToken).then(setPage, (err: Error) => setError(err.message));
  }, [quillName, session, ready]);

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="No creator by that name"
          description={error}
          actions={
            <ButtonLink href="/campfire" variant="primary">
              Visit the Campfire
            </ButtonLink>
          }
        />
      </div>
    );
  }
  if (!page) {
    return (
      <div className="shell section" aria-busy="true">
        <div className="skeleton" style={{ height: 240, borderRadius: 26 }} />
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="page-head creator-head">
        <span className="creator-head__avatar" aria-hidden>
          {page.quillName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <span className="eyebrow">Inkverse creator</span>
          <h1>{page.quillName}</h1>
          {page.bio ? <p>{page.bio}</p> : null}
          {page.genres.length ? (
            <div className="ink-chip-wrap" style={{ marginTop: 10 }}>
              {page.genres.map((g) => (
                <span key={g} className="badge">
                  {g}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="creator-layout">
        <div className="stack" style={{ gap: 28 }}>
          <section>
            <h2 className="panel-title">Published books</h2>
            {page.books.length ? (
              <div className="shelf shelf--compact">
                {page.books.map((book) => (
                  <Link key={book.slug} href={`/inkverse/library/${book.slug}`} className="shelf__book">
                    <BookCover title={book.title} author={book.author.quillName} styleIndex={book.coverStyle} size="sm" />
                    <h3>{book.title}</h3>
                    <p className="muted">
                      {book.chapterCount} chapters · {formatWords(book.wordCount)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted">No books on the Debut Shelf yet.</p>
            )}
          </section>
          <section>
            <h2 className="panel-title">At the Campfire</h2>
            {page.posts.length ? (
              <ul className="creator-posts">
                {page.posts.map((post) => (
                  <li key={post.id}>
                    <span className="badge" style={{ color: postKinds.find((k) => k.value === post.kind)?.color }}>
                      {postKinds.find((k) => k.value === post.kind)?.label}
                    </span>
                    <Link href={`/campfire/${post.id}`}>{post.title}</Link>
                    <span className="muted">
                      {post.embers} Embers · {timeAgo(post.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Hasn&apos;t posted at the Campfire yet.</p>
            )}
          </section>
        </div>
        <aside className="stack" style={{ gap: 16 }}>
          <RankCard ranks={page.ranks} />
          <Badges ranks={page.ranks} />
        </aside>
      </div>
    </div>
  );
}
