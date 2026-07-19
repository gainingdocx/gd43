"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function deleteAccount() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    const j = (await res.json().catch(() => null)) as { error?: string } | null;
    setError(j?.error ?? "Deletion failed — try again.");
    setBusy(false);
    setConfirming(false);
  }

  return (
    <div className="space-y-3">
      <Button
        render={<a href="/api/account/export" download />}
        variant="outline"
        size="lg"
        className="w-full"
      >
        <Download className="size-4" aria-hidden /> Download my data (JSON)
      </Button>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {confirming ? (
        <div className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            This permanently deletes your account, documents, page images and
            shipment history. There is no undo.
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={busy}
              onClick={() => void deleteAccount()}
            >
              {busy ? "Deleting…" : "Yes, delete everything"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="lg"
          className="w-full text-destructive hover:bg-destructive/10"
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="size-4" aria-hidden /> Delete account
        </Button>
      )}
    </div>
  );
}
