import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type EmailAttachment = {
  filename: string;
  content: string | ArrayBuffer | ArrayBufferView;
  type: string;
  disposition: "attachment" | "inline";
};

type SendEmailBinding = {
  send(message: {
    to: string;
    from: string | { email: string; name?: string };
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string;
    attachments?: EmailAttachment[];
  }): Promise<{ messageId: string }>;
};

export async function sendCloudflareEmail(message: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string | { email: string; name?: string };
  replyTo?: string;
  attachments?: EmailAttachment[];
}) {
  const { env } = await getCloudflareContext({ async: true });
  const binding = (env as CloudflareEnv & { EMAIL?: SendEmailBinding }).EMAIL;
  if (!binding) throw new Error("Cloudflare Email Sending binding is not configured");
  return binding.send({
    to: message.to,
    from: message.from ?? {
      email: process.env.EMAIL_INGEST_FROM || "reports@docs.gainingdocx.com",
      name: "GainingDocx Docs",
    },
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
    attachments: message.attachments,
  });
}
