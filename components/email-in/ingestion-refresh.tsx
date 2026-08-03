"use client";

import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function IngestionRefresh({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => router.refresh(), 7000);
    return () => window.clearInterval(timer);
  }, [active, router]);

  return (
    <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <RefreshCcw className={`size-3.5 ${active ? "animate-spin" : ""}`} aria-hidden />
      {active ? "Checking for progress automatically" : "Status is up to date"}
    </p>
  );
}
