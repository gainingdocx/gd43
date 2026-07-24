"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AppErrorView({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reference, setReference] = useState(
    error.digest?.slice(0, 8).toUpperCase() ?? ""
  );
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    const nextReference =
      reference || crypto.randomUUID().slice(0, 8).toUpperCase();
    if (!reference) setReference(nextReference);
    void fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: nextReference,
        digest: error.digest,
        message: error.message,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [error, reference]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 text-center shadow-xl sm:p-9">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-black text-primary">Something didn&apos;t load correctly</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your data has not been intentionally changed. Try the page again. If the problem continues, share the reference below with support.
        </p>
        <p className="mt-4 rounded-xl bg-muted px-3 py-2 font-mono text-xs font-bold text-foreground">
          Reference {reference || "Preparing…"}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}><RefreshCw className="size-4" aria-hidden /> Try again</Button>
          <Button render={<Link href="/" />} variant="outline">Return home</Button>
        </div>
      </section>
    </main>
  );
}
