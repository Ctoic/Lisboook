"use client";

import { usePathname, useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { AudiobookListItemContract } from "@lisbook/types";
import { BookCard } from "@/components/book-card";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { plural } from "@/lib/format";

const sorts = {
  featured: { label: "Featured first", compare: (a: AudiobookListItemContract, b: AudiobookListItemContract) => Number(b.isFeatured) - Number(a.isFeatured) },
  title: { label: "Title A–Z", compare: (a: AudiobookListItemContract, b: AudiobookListItemContract) => a.title.localeCompare(b.title) },
  shortest: { label: "Shortest first", compare: (a: AudiobookListItemContract, b: AudiobookListItemContract) => a.totalDurationSeconds - b.totalDurationSeconds },
  longest: { label: "Longest first", compare: (a: AudiobookListItemContract, b: AudiobookListItemContract) => b.totalDurationSeconds - a.totalDurationSeconds }
} as const;

type SortKey = keyof typeof sorts;

interface ExploreViewProps {
  books: AudiobookListItemContract[];
  initialQuery: string;
  initialCategory: string | null;
  initialSort: string;
}

export function ExploreView({ books, initialQuery, initialCategory, initialSort }: ExploreViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [sort, setSort] = useState<SortKey>(initialSort in sorts ? (initialSort as SortKey) : "featured");
  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const book of books) if (book.categoryName) counts.set(book.categoryName, (counts.get(book.categoryName) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [books]);

  const results = useMemo(() => {
    const terms = deferredQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return books
      .filter((book) => !category || book.categoryName === category)
      .filter((book) => {
        if (!terms.length) return true;
        const haystack = [book.title, book.authorName, book.narratorName, book.categoryName].join(" ").toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort(sorts[sort].compare);
  }, [books, category, deferredQuery, sort]);

  // Keep the URL shareable without adding history entries on every keystroke.
  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredQuery.trim()) params.set("q", deferredQuery.trim());
    if (category) params.set("category", category);
    if (sort !== "featured") params.set("sort", sort);
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }, [category, deferredQuery, pathname, router, sort]);

  const filtered = Boolean(query.trim() || category);
  const reset = () => {
    setQuery("");
    setCategory(null);
  };

  return (
    <>
      <div className="toolbar glass glass--strong">
        <div className="toolbar__row">
          <div className="input-group" role="search">
            <SearchIcon size={19} />
            <label htmlFor="explore-search" className="sr-only">
              Search audiobooks
            </label>
            <input
              id="explore-search"
              className="input"
              type="search"
              placeholder="Search titles, authors, narrators…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              style={{ paddingRight: 52 }}
            />
            {query ? (
              <Button variant="ghost" icon size="sm" className="input-group__action" onClick={() => setQuery("")} aria-label="Clear search">
                <CloseIcon size={16} />
              </Button>
            ) : null}
          </div>
          <label htmlFor="explore-sort" className="sr-only">
            Sort by
          </label>
          <select id="explore-sort" className="input toolbar__sort" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            {Object.entries(sorts).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
        {categories.length ? (
          <div className="chips" role="group" aria-label="Filter by category">
            <button type="button" className="chip" aria-pressed={!category} onClick={() => setCategory(null)}>
              All <span className="chip__count">{books.length}</span>
            </button>
            {categories.map(([name, count]) => (
              <button key={name} type="button" className="chip" aria-pressed={category === name} onClick={() => setCategory(category === name ? null : name)}>
                {name} <span className="chip__count">{count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="results-meta" aria-live="polite">
        <span>
          {plural(results.length, "audiobook")}
          {category ? ` in ${category}` : ""}
          {deferredQuery.trim() ? ` matching “${deferredQuery.trim()}”` : ""}
        </span>
        {filtered ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {results.length ? (
        <div className="grid grid--books">
          {results.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<SearchIcon size={28} />}
          title={books.length ? "No matches yet" : "The shelves are being stocked"}
          description={
            books.length
              ? "Try a different spelling, a shorter search, or another category."
              : "New audiobooks are on their way. Check back soon."
          }
          actions={
            filtered ? (
              <Button variant="primary" onClick={reset}>
                Show all audiobooks
              </Button>
            ) : undefined
          }
        />
      )}
    </>
  );
}
