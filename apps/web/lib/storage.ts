// localStorage can throw (private mode, blocked storage), so every access is guarded.

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Non-critical: preferences simply won't persist.
  }
}

export function removeKey(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const storageKeys = {
  theme: "lisbook.theme",
  session: "lisbook.session",
  favorites: "lisbook.favorites",
  progress: "lisbook.progress",
  playbackRate: "lisbook.playbackRate"
} as const;
