// Tolerant JSON handling for model output: streamed prefixes, markdown
// fences, trailing prose, truncation. Pure functions — unit tested.

/** Extract the JSON-looking body: strip fences/prose, start at first "{". */
function extractBody(text: string): string | null {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  if (fence && fence[1].includes("{")) t = fence[1];
  const start = t.indexOf("{");
  if (start === -1) return null;
  return t.slice(start);
}

/**
 * Single scan of `s` tracking string/escape state and bracket depth.
 * Returns the index just past the last position where all brackets were
 * balanced (0 if never), plus the closers needed to terminate the input.
 */
function scan(s: string): {
  balancedEnd: number;
  closers: string;
  lastSafe: number;
} {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let balancedEnd = 0;
  let lastSafe = 0; // cut point just before/after the last structural delimiter
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") {
      stack.push(ch === "{" ? "}" : "]");
      lastSafe = i + 1;
    } else if (ch === ",") lastSafe = i;
    else if (ch === "}" || ch === "]") {
      if (stack[stack.length - 1] === ch) stack.pop();
      if (stack.length === 0) balancedEnd = i + 1;
    }
  }
  const closers = (inString ? '"' : "") + stack.slice().reverse().join("");
  return { balancedEnd, closers, lastSafe };
}

/** Remove trailing commas before } or ] and dangling ,/: at the end. */
function cleanTail(s: string): string {
  let out = s.replace(/,(\s*[}\]])/g, "$1").trimEnd();
  if (out.endsWith(":")) out += " null";
  else if (out.endsWith(",")) out = out.slice(0, -1);
  return out;
}

function tryParse(s: string): unknown | undefined {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Best-effort parse of complete-or-partial model output.
 * Returns null when nothing object-like can be recovered.
 */
export function tolerantParse(text: string): unknown | null {
  const body = extractBody(text);
  if (!body) return null;

  const direct = tryParse(body);
  if (direct !== undefined) return direct;

  const { balancedEnd } = scan(body);

  // Complete object followed by trailing prose.
  if (balancedEnd > 0) {
    const cut = tryParse(cleanTail(body.slice(0, balancedEnd)));
    if (cut !== undefined) return cut;
  }

  // Truncated stream: close open strings/brackets.
  const closedBody = cleanTail(body) === body ? body : cleanTail(body);
  const closed = tryParse(closedBody + scan(closedBody).closers);
  if (closed !== undefined) return closed;

  // Truncated mid-token (e.g. an unfinished key): cut back to the last
  // structural delimiter outside strings, then close.
  const { lastSafe } = scan(body);
  if (lastSafe > 0) {
    const shortened = cleanTail(body.slice(0, lastSafe));
    const reclosed = tryParse(shortened + scan(shortened).closers);
    if (reclosed !== undefined) return reclosed;
  }

  // Last resort: drop a possibly-corrupt final line, then close.
  const lastNewline = body.lastIndexOf("\n");
  if (lastNewline > 0) {
    const shortened = cleanTail(body.slice(0, lastNewline));
    const reclosed = tryParse(shortened + scan(shortened).closers);
    if (reclosed !== undefined) return reclosed;
  }
  return null;
}

/** Like tolerantParse but throws when the text is unrecoverable. */
export function repairJson(text: string): unknown {
  const value = tolerantParse(text);
  if (value === null) throw new Error("model output is not repairable JSON");
  return value;
}

export type FieldPatch = { path: string; value: unknown };

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Diff two snapshots of the extraction fields. Objects are walked; arrays
 * and primitives are treated as leaves (the whole value is re-emitted when
 * it changes). Used to push incremental SSE field updates.
 */
export function diffFields(
  prev: unknown,
  next: unknown,
  base = ""
): FieldPatch[] {
  if (
    next === null ||
    typeof next !== "object" ||
    Array.isArray(next)
  ) {
    return deepEqual(prev, next) ? [] : [{ path: base, value: next }];
  }
  const prevObj =
    prev !== null && typeof prev === "object" && !Array.isArray(prev)
      ? (prev as Record<string, unknown>)
      : {};
  const patches: FieldPatch[] = [];
  for (const [key, value] of Object.entries(next)) {
    const path = base ? `${base}.${key}` : key;
    patches.push(...diffFields(prevObj[key], value, path));
  }
  return patches;
}
