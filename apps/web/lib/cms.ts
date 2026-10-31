// CMS page bodies are stored in `contentJson`. Seeded pages hold plain text, while future
// admin-authored pages may hold JSON ({ body } or { paragraphs }), so accept both.
export function pageParagraphs(content: string | undefined | null): string[] {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content) as unknown;
    if (typeof parsed === "string") return splitParagraphs(parsed);
    if (parsed && typeof parsed === "object") {
      const value = parsed as { body?: unknown; paragraphs?: unknown };
      if (Array.isArray(value.paragraphs)) return value.paragraphs.filter((p): p is string => typeof p === "string");
      if (typeof value.body === "string") return splitParagraphs(value.body);
    }
  } catch {
    // Not JSON — treat as plain text.
  }
  return splitParagraphs(content);
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}
