interface CoverProps {
  title: string;
  author?: string | null;
  slug: string;
  coverUrl?: string | null;
  className?: string;
}

// Curated gradient pairs so generated covers always look intentional, never random.
const palettes = [
  ["#1f6f43", "#94d769"],
  ["#0f3b57", "#2dd4bf"],
  ["#3b1d5c", "#a78bfa"],
  ["#5c2a14", "#f59e0b"],
  ["#14324f", "#60a5fa"],
  ["#4a1530", "#f472b6"],
  ["#1d3a2a", "#a3e635"],
  ["#2b2154", "#818cf8"]
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function coverGradient(slug: string) {
  const [from, to] = palettes[hash(slug) % palettes.length];
  return `linear-gradient(150deg, ${to} -10%, ${from} 70%)`;
}

export function Cover({ title, author, slug, coverUrl, className }: CoverProps) {
  return (
    <div className={`cover${className ? ` ${className}` : ""}`}>
      {coverUrl ? (
        <img src={coverUrl} alt={`Cover of ${title}`} loading="lazy" />
      ) : (
        <div className="cover__art" style={{ background: coverGradient(slug) }} role="img" aria-label={`Cover of ${title}`}>
          <span className="cover__rings" aria-hidden />
          <span className="cover__title">{title}</span>
          {author ? <span className="cover__author">{author}</span> : null}
        </div>
      )}
    </div>
  );
}
