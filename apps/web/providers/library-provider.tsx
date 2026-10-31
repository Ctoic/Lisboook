"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AudiobookListItemContract } from "@lisbook/types";
import { readJson, storageKeys, writeJson } from "@/lib/storage";

// Favorites and progress live on the device until the API exposes listener endpoints for them.

export type BookSnapshot = Pick<
  AudiobookListItemContract,
  "id" | "slug" | "title" | "authorName" | "narratorName" | "categoryName" | "coverUrl" | "totalDurationSeconds"
>;

export interface ProgressEntry {
  book: BookSnapshot;
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  position: number;
  duration: number;
  updatedAt: number;
}

interface LibraryContextValue {
  favorites: BookSnapshot[];
  isFavorite: (bookId: string) => boolean;
  toggleFavorite: (book: BookSnapshot) => boolean;
  progress: Record<string, ProgressEntry>;
  saveProgress: (entry: Omit<ProgressEntry, "updatedAt">) => void;
  latestForBook: (bookId: string) => ProgressEntry | undefined;
  recent: ProgressEntry[];
  clearHistory: () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function toSnapshot(book: AudiobookListItemContract | BookSnapshot): BookSnapshot {
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    authorName: book.authorName,
    narratorName: book.narratorName ?? null,
    categoryName: book.categoryName ?? null,
    coverUrl: book.coverUrl ?? null,
    totalDurationSeconds: book.totalDurationSeconds
  };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<BookSnapshot[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});

  useEffect(() => {
    setFavorites(readJson<BookSnapshot[]>(storageKeys.favorites, []));
    setProgress(readJson<Record<string, ProgressEntry>>(storageKeys.progress, {}));
  }, []);

  const isFavorite = useCallback((bookId: string) => favorites.some((book) => book.id === bookId), [favorites]);

  const toggleFavorite = useCallback(
    (book: BookSnapshot) => {
      const exists = favorites.some((item) => item.id === book.id);
      const next = exists ? favorites.filter((item) => item.id !== book.id) : [toSnapshot(book), ...favorites];
      setFavorites(next);
      writeJson(storageKeys.favorites, next);
      return !exists;
    },
    [favorites]
  );

  const saveProgress = useCallback((entry: Omit<ProgressEntry, "updatedAt">) => {
    setProgress((current) => {
      const next = { ...current, [entry.chapterId]: { ...entry, updatedAt: Date.now() } };
      writeJson(storageKeys.progress, next);
      return next;
    });
  }, []);

  const latestForBook = useCallback(
    (bookId: string) =>
      Object.values(progress)
        .filter((entry) => entry.book.id === bookId)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0],
    [progress]
  );

  // One row per book: the most recently touched chapter.
  const recent = useMemo(() => {
    const byBook = new Map<string, ProgressEntry>();
    for (const entry of Object.values(progress)) {
      const existing = byBook.get(entry.book.id);
      if (!existing || existing.updatedAt < entry.updatedAt) byBook.set(entry.book.id, entry);
    }
    return [...byBook.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [progress]);

  const clearHistory = useCallback(() => {
    setProgress({});
    writeJson(storageKeys.progress, {});
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, progress, saveProgress, latestForBook, recent, clearHistory }),
    [favorites, isFavorite, toggleFavorite, progress, saveProgress, latestForBook, recent, clearHistory]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used inside LibraryProvider");
  return context;
}
