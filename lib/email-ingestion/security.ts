const PREFIXES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46, 0x2d]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
};

function startsWith(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

/** Reject MIME-spoofed attachments before they enter private document storage. */
export function attachmentMatchesMime(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/webp") {
    return bytes.length >= 12
      && startsWith(bytes, [0x52, 0x49, 0x46, 0x46])
      && startsWith(bytes.slice(8), [0x57, 0x45, 0x42, 0x50]);
  }
  const signatures = PREFIXES[contentType];
  return Boolean(signatures?.some((signature) => startsWith(bytes, signature)));
}

export function intakeWindowStart(now = Date.now()) {
  return new Date(now - 10 * 60 * 1000).toISOString();
}

export const MAX_EMAILS_PER_TEN_MINUTES = 25;
