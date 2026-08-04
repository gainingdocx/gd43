// One error shape for the whole public API.
//
// Every failure returns the same envelope, so a client writes one error handler
// rather than one per endpoint:
//
//   { "error": { "type", "code", "message", "param"?, "request_id" } }
//
// `code` is stable and machine-readable — it is part of the contract and must
// not change meaning between versions. `message` is for humans and may be
// reworded freely. `param` names the offending input where one exists, which is
// the difference between "invalid_request" and a client that can actually fix
// itself.

export type ErrorType =
  | "authentication_error"
  | "invalid_request_error"
  | "not_found_error"
  | "rate_limit_error"
  | "api_error";

export const ERROR_STATUS: Record<ErrorType, number> = {
  authentication_error: 401,
  invalid_request_error: 400,
  not_found_error: 404,
  rate_limit_error: 429,
  api_error: 500,
};

export class ApiError extends Error {
  readonly type: ErrorType;
  readonly code: string;
  readonly param?: string;
  readonly status: number;
  readonly headers?: Record<string, string>;

  constructor(opts: {
    type: ErrorType;
    code: string;
    message: string;
    param?: string;
    status?: number;
    headers?: Record<string, string>;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.type = opts.type;
    this.code = opts.code;
    this.param = opts.param;
    this.status = opts.status ?? ERROR_STATUS[opts.type];
    this.headers = opts.headers;
  }
}

export const badRequest = (message: string, param?: string, code = "invalid_request") =>
  new ApiError({ type: "invalid_request_error", code, message, param });

export const unauthorized = (message: string, code = "invalid_api_key") =>
  new ApiError({ type: "authentication_error", code, message });

export const notFound = (message: string, code = "resource_not_found") =>
  new ApiError({ type: "not_found_error", code, message });

export const serverError = (message: string, code = "internal_error") =>
  new ApiError({ type: "api_error", code, message });
