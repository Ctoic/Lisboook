interface SectionPlaceholderProps {
  title: string;
  description: string;
  items: Array<{ label: string; detail: string }>;
}

export function SectionPlaceholder({ title, description, items }: SectionPlaceholderProps) {
  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Planned next slice</p>
          <h1>{title}</h1>
        </div>
        <p>{description}</p>
      </div>
      <div className="feature-grid">
        {items.map((item) => (
          <article className="panel" key={item.label}>
            <h3>{item.label}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
