"use client";

import Link from "next/link";
import type { AudiobookListItemContract } from "@lisbook/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { HeartIcon, PlayIcon } from "@/components/ui/icons";
import { formatDuration } from "@/lib/format";
import { toSnapshot, useLibrary, type BookSnapshot } from "@/providers/library-provider";
import { useToast } from "@/providers/toast-provider";

export function BookCard({ book }: { book: AudiobookListItemContract | BookSnapshot }) {
  const { isFavorite, toggleFavorite } = useLibrary();
  const toast = useToast();
  const saved = isFavorite(book.id);
  const href = `/books/${book.slug}`;

  return (
    <article className="book-card" style={{ position: "relative" }}>
      <div className="book-card__media">
        <Cover title={book.title} author={book.authorName} slug={book.slug} coverUrl={book.coverUrl} />
        <Button
          variant="glass"
          icon
          className="book-card__fav"
          active={saved}
          style={{ zIndex: 2 }}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${book.title} from favorites` : `Save ${book.title} to favorites`}
          onClick={() => {
            const added = toggleFavorite(toSnapshot(book));
            toast({ title: added ? "Saved to your library" : "Removed from your library", description: book.title });
          }}
        >
          <HeartIcon size={16} filled={saved} />
        </Button>
        <ButtonLink href={href} variant="primary" icon className="book-card__play" style={{ zIndex: 2 }} aria-label={`Listen to ${book.title}`} tabIndex={-1}>
          <PlayIcon size={16} />
        </ButtonLink>
      </div>
      <div className="book-card__body">
        <h3 className="book-card__title">
          <Link href={href}>{book.title}</Link>
        </h3>
        <p className="book-card__meta">{book.authorName}</p>
        <div className="book-card__foot">
          {book.categoryName ? <span>{book.categoryName}</span> : null}
          {book.categoryName && book.totalDurationSeconds ? <span className="dot" /> : null}
          {book.totalDurationSeconds ? <span>{formatDuration(book.totalDurationSeconds)}</span> : null}
        </div>
      </div>
    </article>
  );
}
