import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCard } from "@/components/book-card";
import { UnavailableState } from "@/components/states";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { getAudiobook, getCatalog } from "@/lib/api";
import { BookDetail } from "./book-detail";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { data: book } = await getAudiobook(slug);
  if (!book) return { title: "Audiobook" };
  return {
    title: `${book.title} by ${book.authorName}`,
    description: book.description.slice(0, 160),
    openGraph: { title: book.title, description: book.description.slice(0, 160), images: book.coverUrl ? [book.coverUrl] : [] }
  };
}

export default async function BookPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [result, catalog] = await Promise.all([getAudiobook(slug), getCatalog()]);

  if (result.error) {
    return (
      <div className="shell section">
        <UnavailableState retryHref={`/books/${slug}`} />
      </div>
    );
  }
  if (!result.data) notFound();

  const book = result.data;
  const others = (catalog.data ?? []).filter((item) => item.id !== book.id);
  const related = [
    ...others.filter((item) => item.categoryName && item.categoryName === book.categoryName),
    ...others.filter((item) => item.categoryName !== book.categoryName)
  ].slice(0, 6);

  return (
    <div className="shell">
      <Link href="/explore" className="back-link">
        <ArrowLeftIcon size={16} /> Back to catalog
      </Link>

      <BookDetail book={book} />

      {related.length ? (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Keep listening</span>
              <h2 style={{ marginTop: 10 }}>{book.categoryName ? `More like ${book.title}` : "You might also like"}</h2>
            </div>
          </div>
          <div className="rail">
            {related.map((item) => (
              <BookCard key={item.id} book={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
