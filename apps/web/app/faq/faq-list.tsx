"use client";

import { useId, useMemo, useState } from "react";
import type { FaqContract } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/icons";

export function FaqList({ faqs }: { faqs: FaqContract[] }) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const baseId = useId();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? faqs.filter((faq) => `${faq.question} ${faq.answer}`.toLowerCase().includes(q)) : faqs;
  }, [faqs, query]);

  return (
    <div className="stack" style={{ gap: 20 }}>
      {faqs.length > 3 ? (
        <div className="input-group" role="search">
          <SearchIcon size={19} />
          <label htmlFor="faq-search" className="sr-only">
            Search questions
          </label>
          <input id="faq-search" className="input" type="search" placeholder="Search questions…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      ) : null}

      {visible.length ? (
        <div className="accordion">
          {visible.map((faq) => {
            const isOpen = open === faq.id;
            const triggerId = `${baseId}-${faq.id}-trigger`;
            const panelId = `${baseId}-${faq.id}-panel`;
            return (
              <div key={faq.id} className="accordion__item glass" data-open={isOpen}>
                <h3 style={{ fontFamily: "var(--font-sans)", letterSpacing: 0 }}>
                  <button
                    id={triggerId}
                    type="button"
                    className="accordion__trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : faq.id)}
                  >
                    {faq.question}
                    <span className="accordion__chevron" aria-hidden>
                      <ChevronDownIcon size={16} />
                    </span>
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={triggerId} className="accordion__panel" inert={!isOpen}>
                  <div>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<SearchIcon size={28} />}
          title={faqs.length ? "No matching questions" : "No questions yet"}
          description={faqs.length ? "Try different keywords, or contact us directly." : "Answers to common questions will appear here soon."}
        />
      )}
    </div>
  );
}
