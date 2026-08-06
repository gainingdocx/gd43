// Google Drive file operations.
//
// Scoped to `drive.file`, which means Drive only ever shows us files the user
// explicitly picked plus files we created ourselves. That is a deliberate
// trade: a customer cannot point us at an arbitrary folder and have it work
// invisibly, but we also cannot read their entire Drive, and it keeps this out
// of Google's restricted-scope assessment.
//
// The base URL is injectable so the client can be exercised against a stub of
// Google's API. That is not a testing nicety here — without it the only way to
// find out whether the request shapes are right is in production, which is
// exactly how the `redirect: "error"` bug shipped.

import "server-only";

const DEFAULT_API_BASE = "https://www.googleapis.com";

function apiBase(): string {
  return (process.env.GOOGLE_API_BASE_URL ?? DEFAULT_API_BASE).replace(/\/$/, "");
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  /** Bumps on every edit — the second half of the import ledger's key. */
  version: string;
  modifiedTime: string | null;
  size: number | null;
}

interface DriveListResponse {
  files?: Array<{ id?: string; name?: string; mimeType?: string; version?: string; modifiedTime?: string; size?: string }>;
  nextPageToken?: string;
}

async function driveFetch(
  accessToken: string,
  path: string,
  init: RequestInit = {},
  timeoutMs = 20_000
): Promise<Response> {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers ?? {}) },
    // Never followed: a redirect while carrying a bearer token would hand that
    // token to whatever host the redirect names.
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error(`Drive rejected the credential (HTTP ${response.status})`);
  }
  if (!response.ok) throw new Error(`Drive returned HTTP ${response.status}`);
  return response;
}

/** The document types the parser accepts. Anything else in the folder is left alone. */
const SUPPORTED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

/**
 * List importable files in a folder.
 *
 * Trashed files are excluded — a file a customer deleted must not come back as
 * a shipment — and so are folders and Google-native documents, which have no
 * bytes to download without an export conversion.
 */
export async function listFolder(accessToken: string, folderId: string, pageLimit = 3): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < pageLimit; page += 1) {
    const query = new URLSearchParams({
      q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, version, modifiedTime, size)",
      pageSize: "100",
      orderBy: "modifiedTime",
      ...(pageToken ? { pageToken } : {}),
    });
    const response = await driveFetch(accessToken, `/drive/v3/files?${query.toString()}`);
    const payload = (await response.json()) as DriveListResponse;

    for (const file of payload.files ?? []) {
      if (!file.id || !file.mimeType || !SUPPORTED_MIME.has(file.mimeType)) continue;
      files.push({
        id: file.id,
        name: file.name ?? "drive-document",
        mimeType: file.mimeType,
        // Absent version means "cannot tell edits apart"; empty string keeps
        // the ledger key stable rather than re-importing on every poll.
        version: file.version ?? "",
        modifiedTime: file.modifiedTime ?? null,
        size: file.size ? Number(file.size) : null,
      });
    }

    pageToken = payload.nextPageToken;
    if (!pageToken) break;
  }

  return files;
}

/** Download a file's bytes, refusing anything larger than the cap. */
export async function downloadFile(accessToken: string, fileId: string, maxBytes: number): Promise<Uint8Array> {
  const response = await driveFetch(accessToken, `/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {}, 60_000);

  // Check the declared length before reading, so an oversized file costs one
  // header rather than a full download into memory.
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new Error(`File is ${declared} bytes, over the ${maxBytes} byte limit`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  // Re-check: content-length can be absent or wrong, and the cap is the point.
  if (bytes.byteLength > maxBytes) throw new Error(`File is ${bytes.byteLength} bytes, over the ${maxBytes} byte limit`);
  return bytes;
}

/** Create a folder if a folder of that name is not already there, and return its id. */
export async function ensureFolder(accessToken: string, name: string, parentId: string): Promise<string> {
  const query = new URLSearchParams({
    q: `'${parentId.replace(/'/g, "\\'")}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    pageSize: "1",
  });
  const found = (await (await driveFetch(accessToken, `/drive/v3/files?${query.toString()}`)).json()) as DriveListResponse;
  const existing = found.files?.[0]?.id;
  if (existing) return existing;

  const created = (await (
    await driveFetch(accessToken, "/drive/v3/files?fields=id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
    })
  ).json()) as { id?: string };
  if (!created.id) throw new Error("Drive did not return an id for the created folder");
  return created.id;
}

/**
 * Move a file between folders.
 *
 * Drive has no move: it is an edit of the parent list, and getting it wrong
 * either duplicates the file into both folders or detaches it from all of them.
 */
export async function moveFile(accessToken: string, fileId: string, fromFolderId: string, toFolderId: string): Promise<void> {
  const query = new URLSearchParams({ addParents: toFolderId, removeParents: fromFolderId, fields: "id, parents" });
  await driveFetch(accessToken, `/drive/v3/files/${encodeURIComponent(fileId)}?${query.toString()}`, { method: "PATCH" });
}

/**
 * Write a result file next to the document it describes.
 *
 * Multipart upload rather than resumable: these are reports measured in
 * kilobytes, and a resumable session would be two extra round trips for no
 * benefit at this size.
 */
export async function uploadFile(
  accessToken: string,
  options: { name: string; mimeType: string; parentId: string; body: Uint8Array | string }
): Promise<string> {
  const boundary = `gdx-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({ name: options.name, parents: [options.parentId] });
  const content = typeof options.body === "string" ? new TextEncoder().encode(options.body) : options.body;

  const head = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: ${options.mimeType}\r\n\r\n`
  );
  const tail = new TextEncoder().encode(`\r\n--${boundary}--\r\n`);
  const payload = new Uint8Array(head.byteLength + content.byteLength + tail.byteLength);
  payload.set(head, 0);
  payload.set(content, head.byteLength);
  payload.set(tail, head.byteLength + content.byteLength);

  const response = await driveFetch(
    accessToken,
    "/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body: payload,
    },
    60_000
  );
  const created = (await response.json()) as { id?: string };
  if (!created.id) throw new Error("Drive did not return an id for the uploaded file");
  return created.id;
}
