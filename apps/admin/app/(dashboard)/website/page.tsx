"use client";

import type { EntityStatus, FaqContract, PageContract } from "@lisbook/types";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Field, Input, Select, Textarea } from "../../../components/ui/field";
import { getFaqs, getPageBySlug, updateAdminFaq, updateAdminPage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

const PAGE_SLUGS = ["about", "contact"] as const;
const STATUS_OPTIONS: EntityStatus[] = ["draft", "published", "archived"];

export default function WebsitePage() {
  const { session } = useAuth();
  const [pages, setPages] = useState<PageContract[]>([]);
  const [faqs, setFaqs] = useState<FaqContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function loadData() {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [pageResults, faqResults] = await Promise.all([
        Promise.all(PAGE_SLUGS.map((slug) => getPageBySlug(slug))),
        getFaqs()
      ]);
      setPages(pageResults);
      setFaqs(faqResults);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load website content");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // The authenticated operator token is the only relevant reload trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  async function handlePageSubmit(event: FormEvent<HTMLFormElement>, pageId: string) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      status: String(formData.get("status") ?? "draft") as EntityStatus
    };

    setSavingKey(`page-${pageId}`);
    setError(null);

    try {
      await updateAdminPage(session.accessToken, pageId, payload);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save page");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleFaqSubmit(event: FormEvent<HTMLFormElement>, faqId: string) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      question: String(formData.get("question") ?? ""),
      answer: String(formData.get("answer") ?? ""),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      status: String(formData.get("status") ?? "draft") as EntityStatus
    };

    setSavingKey(`faq-${faqId}`);
    setError(null);

    try {
      await updateAdminFaq(session.accessToken, faqId, payload);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save FAQ");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Website management</p>
          <h1>Pages and FAQ</h1>
        </div>
        <p>
          Move customer-facing website copy out of hardcoded files and into operator-managed
          records that can be updated without touching the frontend codebase.
        </p>
      </div>

      {error ? <div className="notice notice--error">{error}</div> : null}

      <div className="form-grid form-grid--two">
        {pages.map((page) => (
          <form
            className="panel stack"
            key={`${page.id}-${page.title}-${page.status}-${page.content}`}
            onSubmit={(event) => void handlePageSubmit(event, page.id)}
          >
            <div className="table__title">
              <strong>{page.slug}</strong>
              <span>{page.locale.toUpperCase()} public page</span>
            </div>

            <div className="form-grid">
              <Field label="Title">
                <Input defaultValue={page.title} name="title" />
              </Field>
              <Field label="Status">
                <Select defaultValue={page.status} name="status">
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Content">
                <Textarea defaultValue={page.content} name="content" />
              </Field>
            </div>

            <Button disabled={isLoading || savingKey === `page-${page.id}`} type="submit">
              {savingKey === `page-${page.id}` ? "Saving..." : "Save page"}
            </Button>
          </form>
        ))}
      </div>

      <div className="stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Website support content</p>
            <h1>FAQ publishing</h1>
          </div>
          <p>Keep answers, order, and publishing status aligned with the public help surface.</p>
        </div>

        {isLoading ? (
          <div className="notice">Loading website records...</div>
        ) : faqs.length === 0 ? (
          <div className="notice">No FAQ records are available yet.</div>
        ) : (
          <div className="stack">
            {faqs.map((faq) => (
              <form
                className="panel stack"
                key={`${faq.id}-${faq.question}-${faq.status}-${faq.sortOrder}`}
                onSubmit={(event) => void handleFaqSubmit(event, faq.id)}
              >
                <div className="form-grid form-grid--two">
                  <Field label="Question">
                    <Input defaultValue={faq.question} name="question" />
                  </Field>
                  <Field label="Display order">
                    <Input defaultValue={faq.sortOrder} min={0} name="sortOrder" type="number" />
                  </Field>
                </div>
                <div className="form-grid form-grid--two">
                  <Field label="Status">
                    <Select defaultValue={faq.status} name="status">
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field hint={`Locale: ${faq.locale.toUpperCase()}`} label="Answer">
                    <Textarea defaultValue={faq.answer} name="answer" />
                  </Field>
                </div>

                <Button disabled={savingKey === `faq-${faq.id}`} type="submit">
                  {savingKey === `faq-${faq.id}` ? "Saving..." : "Save FAQ"}
                </Button>
              </form>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
