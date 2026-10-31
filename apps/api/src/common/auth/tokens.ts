import { createHmac, timingSafeEqual } from "node:crypto";

type TokenKind = "access" | "refresh";

interface TokenPayload {
  sub: string;
  kind: TokenKind;
  exp: number;
}

const TTL_SECONDS: Record<TokenKind, number> = {
  access: 60 * 60 * 24 * 30,
  refresh: 60 * 60 * 24 * 90
};

const DEV_SECRET = "lisbook-dev-secret-not-for-production";

function secret() {
  const configured = process.env.AUTH_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return DEV_SECRET;
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

/** A compact HMAC-signed token: base64url(payload).signature. */
export function issueToken(userId: string, kind: TokenKind) {
  const payload: TokenPayload = { sub: userId, kind, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS[kind] };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Returns the user id for a valid, unexpired token of the given kind, otherwise null. */
export function readToken(token: string, kind: TokenKind): string | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    if (payload.kind !== kind || typeof payload.sub !== "string" || payload.exp < Date.now() / 1000) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
