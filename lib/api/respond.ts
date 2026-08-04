// Response helpers and the request wrapper every v1 route runs inside.
//
// The wrapper exists so no route has to remember the cross-cutting concerns:
// a request id on every response, CORS preflight, a uniform error envelope, and
// the guarantee that an unexpected throw becomes a clean 500 rather than a
// Cloudflare error page a client cannot parse.

import { ApiError, serverError } from "./errors";

/** Echoed back on every response so a client can quote it in a support thread. */
export function requestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

const BASE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  // The API is key-authenticated and safe to call from any origin. Keys must
  // never ship in browser code, which the docs state explicitly.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

export function json(body: unknown, init: { status?: number; headers?: Record<string, string>; id?: string } = {}) {
  const id = init.id ?? requestId();
  return Response.json(body, {
    status: init.status ?? 200,
    headers: { ...BASE_HEADERS, "X-Request-Id": id, ...(init.headers ?? {}) },
  });
}

export function errorResponse(error: unknown, id: string): Response {
  const apiError =
    error instanceof ApiError
      ? error
      : serverError("The request could not be completed. Retry, and contact support with the request id if it persists.");

  return Response.json(
    {
      error: {
        type: apiError.type,
        code: apiError.code,
        message: apiError.message,
        ...(apiError.param ? { param: apiError.param } : {}),
        request_id: id,
      },
    },
    {
      status: apiError.status,
      headers: { ...BASE_HEADERS, "X-Request-Id": id, ...(apiError.headers ?? {}) },
    }
  );
}

/** Standard CORS preflight; every v1 route re-exports this as OPTIONS. */
export function preflight() {
  return new Response(null, { status: 204, headers: BASE_HEADERS });
}

/**
 * Wrap a route handler so it can throw ApiError freely and still produce the
 * documented envelope. Unexpected throws are deliberately not echoed to the
 * caller — an internal message could leak schema or credential detail — but the
 * request id ties the response to the platform log.
 */
export function handler(fn: (request: Request, id: string) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const id = requestId();
    try {
      return await fn(request, id);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        console.error(`[api] unhandled ${id}`, error);
      }
      return errorResponse(error, id);
    }
  };
}

/** Parse and validate a JSON body, failing with the documented envelope. */
export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new ApiError({
      type: "invalid_request_error",
      code: "unsupported_content_type",
      message: "Content-Type must be application/json.",
    });
  }
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError({
      type: "invalid_request_error",
      code: "invalid_json",
      message: "Request body must be valid JSON.",
    });
  }
}

/** A list envelope shaped like the rest of the industry, so clients feel at home. */
export function list<T>(data: T[], opts: { hasMore?: boolean; total?: number } = {}) {
  return {
    object: "list" as const,
    data,
    has_more: opts.hasMore ?? false,
    ...(opts.total !== undefined ? { total_count: opts.total } : {}),
  };
}
