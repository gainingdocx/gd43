import Link from "next/link";
import { ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Home</h1>
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-input bg-card px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-signal">
          <ScanLine className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="font-semibold">No documents yet</p>
          <p className="text-sm text-muted-foreground">
            Document parsing arrives in an upcoming milestone. Your recent
            documents, usage and next actions will live here.
          </p>
        </div>
        <Button
          render={<Link href="/app/scan" />}
          size="lg"
          className="bg-signal text-signal-foreground hover:bg-signal/90"
        >
          Scan a document
        </Button>
      </div>
    </div>
  );
}
