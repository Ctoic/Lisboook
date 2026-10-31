const metricCards = [
  {
    label: "Catalog readiness",
    value: "Live",
    detail: "Audiobooks, authors, narrators, and categories are now wired to the NestJS API."
  },
  {
    label: "Admin auth",
    value: "Enabled",
    detail: "Seeded operator login and role-aware protected routing are in place."
  },
  {
    label: "Website ops",
    value: "Live CMS",
    detail: "About, Contact, FAQ, users, roles, and asset registry are accessible from admin."
  }
];

const deliveryRails = [
  "Manage all audiobook metadata dynamically from one workspace.",
  "Keep status and visibility explicit before content reaches the public web app.",
  "Operate website copy, FAQ records, users, roles, and media references from dedicated sections.",
  "Reuse modal and table flows across catalog and website management surfaces.",
  "Reserve audience moderation and audit tooling for the next backend-capable slice."
];

export default function DashboardPage() {
  return (
    <section className="stack">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Phase 2 delivery</p>
          <h1>Admin control surface</h1>
          <p>
            The platform now has a reusable admin shell, authenticated operator session flow,
            live catalog management, website content editing, operator visibility, and asset
            registry controls against the database-backed API.
          </p>
        </div>
        <div className="hero-panel__rail">
          {deliveryRails.map((item) => (
            <div className="rail-item" key={item}>
              <span />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="metric-grid">
        {metricCards.map((card) => (
          <article className="panel" key={card.label}>
            <p className="metric-label">{card.label}</p>
            <h2>{card.value}</h2>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
