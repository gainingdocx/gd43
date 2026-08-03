export const DEFAULT_EMAIL_INGEST_DOMAIN = "docs.gainingdocx.com";

export function emailInAddress(token: string, domain = process.env.EMAIL_INGEST_DOMAIN || DEFAULT_EMAIL_INGEST_DOMAIN) {
  return `${token.toLowerCase()}@${domain.toLowerCase()}`;
}

export function addressToken(recipients: string[], domain = process.env.EMAIL_INGEST_DOMAIN || DEFAULT_EMAIL_INGEST_DOMAIN) {
  const expectedDomain = domain.toLowerCase();
  for (const recipient of recipients) {
    const match = recipient.trim().toLowerCase().match(/<?([a-z0-9]{24,64})@([^>\s]+)>?$/);
    if (match?.[2] === expectedDomain) return match[1];
  }
  return null;
}

export function senderAddress(value: string) {
  const bracketed = value.match(/<([^<>\s]+@[^<>\s]+)>/);
  if (bracketed) return bracketed[1].toLowerCase();
  const bare = value.trim().match(/^([^\s<>]+@[^\s<>]+)$/);
  return bare?.[1].toLowerCase() ?? null;
}
