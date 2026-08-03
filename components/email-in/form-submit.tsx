"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function EmailInSubmit({ label, pendingLabel, variant = "outline" }: { label: string; pendingLabel: string; variant?: "default" | "outline" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} className="w-full" disabled={pending}>{pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{pending ? pendingLabel : label}</Button>;
}
