import type { ComponentType, ReactNode } from "react";

interface AuthFieldProps {
  id: string;
  name: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  /** Rendered on the label row, right-aligned — e.g. a "Forgot password?" link. */
  trailing?: ReactNode;
}

/** Single labelled input styled to match the auth card across every screen. */
export function AuthField({
  id,
  name,
  label,
  icon: Icon,
  type = "text",
  autoComplete,
  placeholder,
  required = true,
  optional = false,
  hint,
  trailing,
}: AuthFieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Icon className="size-4 shrink-0 text-primary" aria-hidden />
          {label}
          {optional && <span className="font-medium text-muted-foreground">(optional)</span>}
        </label>
        {trailing}
      </div>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-[0_1px_2px_rgba(16,42,92,0.04)] outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
      />
      {hint && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}
