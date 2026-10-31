import type { Metadata } from "next";
import { UnavailableState } from "@/components/states";
import { getCatalog } from "@/lib/api";
import { ExploreView } from "./explore-view";

export const metadata: Metadata = {
  title: "Explore audiobooks",
  description: "Search and browse every free audiobook in the Lisbook catalog."
};

export default async function ExplorePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const [{ q, category, sort }, catalog] = await Promise.all([searchParams, getCatalog()]);

  return (
    <div className="shell">
      <header className="page-head">
        <span className="eyebrow">The catalog</span>
        <h1>Explore audiobooks</h1>
        <p>Search across titles, authors, narrators and categories — every listen is free.</p>
      </header>
      {catalog.data ? (
        <ExploreView books={catalog.data} initialQuery={q ?? ""} initialCategory={category ?? null} initialSort={sort ?? "featured"} />
      ) : (
        <UnavailableState retryHref="/explore" />
      )}
    </div>
  );
}
