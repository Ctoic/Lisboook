export default function Loading() {
  return (
    <div className="shell" aria-busy="true" aria-label="Loading">
      <div className="page-head">
        <div className="skeleton" style={{ width: 120, height: 14 }} />
        <div className="skeleton" style={{ width: "min(520px, 80%)", height: 52, margin: "18px 0 14px" }} />
        <div className="skeleton" style={{ width: "min(420px, 70%)", height: 18 }} />
      </div>
      <div className="grid grid--books">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ padding: 12 }}>
            <div className="skeleton" style={{ aspectRatio: "2 / 3", borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 16, marginTop: 14, width: "80%" }} />
            <div className="skeleton" style={{ height: 12, marginTop: 8, width: "55%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
