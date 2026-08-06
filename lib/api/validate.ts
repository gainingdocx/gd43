// Input coercion for API request bodies.
//
// Every helper throws the documented `invalid_request_error` envelope naming the
// offending `param`, so a client gets told exactly which field to fix instead of
// a generic 400. Numbers are the common case in the freight calculators and the
// common source of mistakes: JSON permits strings where a number is meant, and
// silently coercing "12abc" to 12 would produce a confidently wrong invoice.

import { badRequest } from "./errors";

export function requireNumber(
  value: unknown,
  param: string,
  opts: { min?: number; max?: number; integer?: boolean } = {}
): number {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  if (!Number.isFinite(num)) throw badRequest(`\`${param}\` must be a number.`, param);
  if (opts.integer && !Number.isInteger(num)) throw badRequest(`\`${param}\` must be a whole number.`, param);
  if (opts.min !== undefined && num < opts.min) throw badRequest(`\`${param}\` must be at least ${opts.min}.`, param);
  if (opts.max !== undefined && num > opts.max) throw badRequest(`\`${param}\` must be at most ${opts.max}.`, param);
  return num;
}

export function optionalNumber(
  value: unknown,
  param: string,
  fallback: number,
  opts: { min?: number; max?: number } = {}
): number {
  if (value === undefined || value === null || value === "") return fallback;
  return requireNumber(value, param, opts);
}

export function requireString(
  value: unknown,
  param: string,
  opts: { min?: number; max?: number } = {}
): string {
  if (typeof value !== "string") throw badRequest(`\`${param}\` must be a string.`, param);
  const trimmed = value.trim();
  if (trimmed.length < (opts.min ?? 1)) throw badRequest(`\`${param}\` is required.`, param);
  if (opts.max && trimmed.length > opts.max) {
    throw badRequest(`\`${param}\` must be ${opts.max} characters or fewer.`, param);
  }
  return trimmed;
}

export function requireEnum<T extends string>(value: unknown, param: string, allowed: readonly T[], fallback?: T): T {
  if ((value === undefined || value === null || value === "") && fallback !== undefined) return fallback;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw badRequest(`\`${param}\` must be one of: ${allowed.join(", ")}.`, param);
  }
  return value as T;
}

export function requireArray<T = unknown>(
  value: unknown,
  param: string,
  opts: { min?: number; max?: number } = {}
): T[] {
  if (!Array.isArray(value)) throw badRequest(`\`${param}\` must be an array.`, param);
  if (opts.min !== undefined && value.length < opts.min) {
    throw badRequest(`\`${param}\` must contain at least ${opts.min} item(s).`, param);
  }
  if (opts.max !== undefined && value.length > opts.max) {
    throw badRequest(`\`${param}\` must contain at most ${opts.max} items.`, param);
  }
  return value as T[];
}

/**
 * Read a path segment counting back from the end of the URL.
 *
 * `/v1/shipments/{id}` is `pathSegment(request, 0)`; `/v1/shipments/{id}/export`
 * is `pathSegment(request, 1)`. Lives here rather than in each route file
 * because a Next route module may only export handlers and the framework's own
 * config keys — exporting a shared helper from one fails the build, and the
 * alternative was the same six lines copied into every dynamic route.
 */
export function pathSegment(request: Request, offsetFromEnd = 0): string {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  return decodeURIComponent(segments[segments.length - 1 - offsetFromEnd] ?? "");
}

/** `limit`/`starting_after` style pagination shared by all list endpoints. */
export function pagination(url: URL, defaultLimit = 25, maxLimit = 100) {
  const raw = url.searchParams.get("limit");
  const limit = raw === null ? defaultLimit : requireNumber(raw, "limit", { min: 1, max: maxLimit, integer: true });
  const offset = requireNumber(url.searchParams.get("offset") ?? 0, "offset", { min: 0, integer: true });
  return { limit, offset };
}
