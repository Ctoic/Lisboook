import { BadRequestException } from "@nestjs/common";

// Validated by hand: the tsx dev runner drops decorator metadata, so ValidationPipe can't see a DTO here.
export function text(value: unknown, field: string, { min = 0, max = 200, optional = false } = {}) {
  if (value === undefined || value === null || (optional && value === "")) {
    if (optional) return undefined;
    throw new BadRequestException(`${field} is required`);
  }
  if (typeof value !== "string") throw new BadRequestException(`${field} must be text`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new BadRequestException(`${field} must be at least ${min} characters`);
  if (trimmed.length > max) throw new BadRequestException(`${field} must be at most ${max} characters`);
  return trimmed;
}

export function oneOf<T extends string>(value: unknown, field: string, options: readonly T[]) {
  if (value === undefined) return undefined;
  if (!options.includes(value as T)) throw new BadRequestException(`${field} must be one of: ${options.join(", ")}`);
  return value as T;
}

/** Up to `max` distinct short names, e.g. aliases. */
export function names(value: unknown, field: string, max = 8) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new BadRequestException(`${field} must be a list`);
  return [...new Set(value.map((v, i) => text(v, `${field} ${i + 1}`, { min: 1, max: 60 })!))].slice(0, max);
}

/** An optional long-form field: undefined leaves it alone, "" clears it. */
export function longText(value: unknown, field: string, max = 1500) {
  if (value === undefined) return undefined;
  return text(value, field, { max, optional: true }) ?? null;
}
