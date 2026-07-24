"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-foreground">
      {label}
      <span className="relative mt-1.5 block">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={15}
          maxLength={128}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-xl border border-input bg-background px-3 pr-12 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
        />
        <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground">
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </span>
      {hint && <span className="mt-1.5 block text-xs font-normal leading-5 text-muted-foreground">{hint}</span>}
    </label>
  );
}
