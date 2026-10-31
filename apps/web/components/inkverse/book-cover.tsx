// Cover Forge: eight hand-tuned cover designs, so every published Saga looks intentional.

export const coverStyles = [
  { name: "Ember", from: "#3a0d0a", to: "#f59e0b", ink: "#fff6e5" },
  { name: "Moss", from: "#0f2a1a", to: "#94d769", ink: "#f2fbe9" },
  { name: "Tide", from: "#06223a", to: "#2dd4bf", ink: "#e8fffb" },
  { name: "Amethyst", from: "#1f0f3a", to: "#a78bfa", ink: "#f4efff" },
  { name: "Rose", from: "#3a0f25", to: "#f472b6", ink: "#fff0f7" },
  { name: "Frost", from: "#0e1c33", to: "#93c5fd", ink: "#eef6ff" },
  { name: "Ash", from: "#141414", to: "#9ca3af", ink: "#f5f5f5" },
  { name: "Gold", from: "#2a1d05", to: "#facc15", ink: "#fffbea" }
];

export function BookCover({
  title,
  author,
  styleIndex,
  tagline,
  size = "md"
}: {
  title: string;
  author: string;
  styleIndex: number;
  tagline?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const style = coverStyles[styleIndex % coverStyles.length] ?? coverStyles[0];
  return (
    <div
      className={`book-cover book-cover--${size}`}
      style={{ background: `radial-gradient(120% 90% at 80% 0%, ${style.to} 0%, transparent 60%), linear-gradient(160deg, ${style.to}55, ${style.from} 65%)`, color: style.ink }}
      role="img"
      aria-label={`Cover of ${title} by ${author}`}
    >
      <span className="book-cover__rings" style={{ borderColor: `${style.ink}33` }} aria-hidden />
      <span className="book-cover__badge" style={{ borderColor: `${style.ink}55` }}>
        Inkverse Original
      </span>
      <span className="book-cover__title">{title}</span>
      {tagline && size !== "sm" ? <span className="book-cover__tagline">{tagline}</span> : null}
      <span className="book-cover__author">{author}</span>
    </div>
  );
}
