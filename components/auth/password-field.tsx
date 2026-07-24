"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  hint,
  minLength,
  placeholder,
  trailing,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  hint?: string;
  placeholder?: string;
  /** Only set on account creation and recovery — never on sign-in, where an
   *  older short password must still be submittable. */
  minLength?: number;
  trailing?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-bold text-foreground">
          <LockKeyhole className="size-4 shrink-0 text-primary" aria-hidden />
          {label}
        </label>
        {trailing}
      </div>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          maxLength={128}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-input bg-background px-3.5 pr-12 text-sm shadow-[0_1px_2px_rgba(16,42,92,0.04)] outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground transition hover:text-primary"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}
