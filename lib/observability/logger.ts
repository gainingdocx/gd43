import "server-only";

type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, unknown>;

function errorFields(error: unknown) {
  if (error instanceof Error) {
    const withStatus = error as Error & { status?: unknown; code?: unknown };
    return {
      errorName: error.name,
      errorMessage: error.message.slice(0, 1000),
      errorStack: error.stack?.slice(0, 4000),
      errorStatus:
        typeof withStatus.status === "number" ? withStatus.status : undefined,
      errorCode:
        typeof withStatus.code === "string" ? withStatus.code : undefined,
    };
  }
  return { errorMessage: String(error).slice(0, 1000) };
}

function write(level: LogLevel, event: string, fields: LogFields = {}) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.info(record);
}

export function logInfo(event: string, fields?: LogFields) {
  write("info", event, fields);
}

export function logWarn(event: string, fields?: LogFields) {
  write("warn", event, fields);
}

export function logError(event: string, error: unknown, fields?: LogFields) {
  write("error", event, { ...fields, ...errorFields(error) });
}

export function createRequestId() {
  return crypto.randomUUID();
}

export function publicReference(requestId: string) {
  return requestId.slice(0, 8).toUpperCase();
}
