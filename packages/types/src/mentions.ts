// Shared by the API (Arc Tracker, Echo) and the Quill Room (live cast panel), so both count the same way.

export interface Nameable {
  name: string;
  aliases?: string[];
}

function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A whole-word, case-insensitive matcher for an entity's name and aliases, or null if it has none worth matching. */
export function mentionPattern(entity: Nameable): RegExp | null {
  const names = [entity.name, ...(entity.aliases ?? [])]
    .map((name) => name.trim())
    .filter((name) => name.length >= 2)
    .sort((a, b) => b.length - a.length)
    .map(escape);
  if (!names.length) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${names.join("|")})(?![\\p{L}\\p{N}_])`, "giu");
}

/** How many times the entity is named in the text. */
export function countMentions(text: string, entity: Nameable): number {
  const pattern = mentionPattern(entity);
  return pattern ? (text.match(pattern)?.length ?? 0) : 0;
}
