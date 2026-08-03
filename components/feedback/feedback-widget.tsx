"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  Send,
  X,
} from "lucide-react";

import { getAnalyticsIdentity, safeAnalyticsPath } from "@/lib/analytics/client";

const CATEGORIES = [
  { value: "suggestion", label: "Suggestion" },
  { value: "problem", label: "Report a problem" },
  { value: "praise", label: "Something I liked" },
  { value: "other", label: "Other" },
] as const;

type SubmitState = "idle" | "sending" | "success" | "error";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => messageRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("sending");
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const identity = getAnalyticsIdentity();

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.get("category"),
          message: data.get("message"),
          email: data.get("email"),
          company: data.get("company"),
          page: safeAnalyticsPath(window.location.pathname),
          ...identity,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not send your feedback.");

      form.reset();
      setSubmitState("success");
    } catch (cause) {
      setSubmitState("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not send your feedback. Please try again.",
      );
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open feedback"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="feedback-dialog"
        onClick={() => {
          setSubmitState("idle");
          setError("");
          setOpen(true);
        }}
        data-analytics-feature="Feedback form opened"
        className="fixed right-0 top-1/2 z-50 flex min-h-26 w-9 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-l-lg bg-signal px-0.5 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.05em] text-white shadow-[0_8px_22px_rgba(16,42,92,0.22)] transition-all hover:w-10 hover:bg-signal/90 focus-visible:w-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-sm:bottom-24 max-sm:right-3 max-sm:top-auto max-sm:size-12 max-sm:min-h-12 max-sm:w-12 max-sm:translate-y-0 max-sm:flex-row max-sm:rounded-full max-sm:p-0 max-sm:hover:w-12 max-sm:focus-visible:w-12"
      >
        {/* The label is hidden below `sm`, where the control becomes a 48px
            round target — large enough to tap, and never collapsed away. */}
        <MessageSquareText className="size-4 shrink-0 max-sm:size-5" aria-hidden />
        <span aria-hidden className="[writing-mode:vertical-rl] max-sm:hidden">Feedback</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex animate-in items-center justify-end bg-[#071b4e]/45 p-3 backdrop-blur-[2px] duration-200 fade-in sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            id="feedback-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            aria-describedby="feedback-description"
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-sm animate-in overflow-y-auto rounded-2xl border border-border bg-white shadow-[0_24px_80px_rgba(7,27,78,0.28)] duration-300 fade-in slide-in-from-right-8 sm:max-h-[calc(100dvh-2.5rem)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border bg-[linear-gradient(135deg,#edf3ff_0%,#fff_72%)] px-4 py-4">
              <div>
                <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <MessageSquareText className="size-5" aria-hidden />
                </div>
                <h2 id="feedback-title" className="text-lg font-black text-primary">
                  Help us make GainingDocx better
                </h2>
                <p id="feedback-description" className="mt-1 text-xs leading-5 text-muted-foreground">
                  Share an idea or tell us what went wrong. We read every message.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Close feedback form"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {submitState === "success" ? (
              <div className="px-6 py-12 text-center" role="status">
                <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden />
                <h3 className="mt-4 text-xl font-black text-primary">Thank you!</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your feedback has been sent. It will help shape what we improve next.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-6 min-h-11 rounded-xl bg-primary px-6 text-sm font-bold text-white transition hover:bg-[#012f91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="space-y-4 px-4 py-4">
                <fieldset>
                  <legend className="text-sm font-bold text-foreground">What is this about?</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {CATEGORIES.map((category, index) => (
                      <label key={category.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={category.value}
                          defaultChecked={index === 0}
                          className="peer sr-only"
                        />
                        <span className="flex min-h-11 items-center justify-center rounded-xl border border-border px-3 text-center text-xs font-bold text-muted-foreground transition hover:border-primary/50 hover:bg-secondary peer-checked:border-primary peer-checked:bg-secondary peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                          {category.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="text-sm font-bold text-foreground">Your feedback</span>
                  <textarea
                    ref={messageRef}
                    name="message"
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={4}
                    placeholder="Tell us what happened or what would make your work easier..."
                    className="mt-2 w-full resize-y rounded-xl border border-input bg-white px-3.5 py-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/75 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Please don&apos;t include passwords or sensitive document data.
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-foreground">
                    Email <span className="font-normal text-muted-foreground">(optional)</span>
                  </span>
                  <input
                    type="email"
                    name="email"
                    maxLength={254}
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="mt-2 min-h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/75 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Add your email only if you would like a reply.
                  </span>
                </label>

                <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                  Company
                  <input name="company" tabIndex={-1} autoComplete="off" />
                </label>

                {submitState === "error" && (
                  <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  data-analytics-feature="Feedback send attempted"
                  disabled={submitState === "sending"}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-signal px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b90404] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
                >
                  {submitState === "sending" ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" aria-hidden /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" aria-hidden /> Send feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
