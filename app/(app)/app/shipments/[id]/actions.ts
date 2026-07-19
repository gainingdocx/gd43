"use server";

// Shipment Check + discrepancy resolver (BUILD_SPEC §M6.4). The check is
// deterministic crossCheck() over the shipment's parsed docs; the resolver
// writes the winning value into the losing document where a safe mapping
// exists, and audits everything to events.

import { revalidatePath } from "next/cache";

import type { NormalizedExtraction } from "@/lib/ai/schemas/shared";
import { setPath } from "@/lib/fields/display";
import { coerceCorrection, correctionPath } from "@/lib/shipments/resolve";
import { createClient } from "@/lib/supabase/server";
import { crossCheck, type ShipmentDoc } from "@/lib/validators";

export async function runShipmentCheck(formData: FormData) {
  const shipmentId = String(formData.get("shipmentId") ?? "");
  if (!shipmentId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: docs } = await supabase
    .from("documents")
    .select("id, doc_type, fields")
    .eq("shipment_id", shipmentId)
    .eq("status", "parsed");

  const shipmentDocs: ShipmentDoc[] = (docs ?? [])
    .filter((d) => d.fields && d.doc_type !== "other")
    .map((d) => ({
      id: d.id as string,
      extraction: {
        detected_type: d.doc_type,
        fields: d.fields,
      } as NormalizedExtraction,
    }));

  const findings = crossCheck(shipmentDocs);

  // Replace unresolved rows; resolved history stays.
  await supabase
    .from("discrepancies")
    .delete()
    .eq("shipment_id", shipmentId)
    .eq("resolved", false);
  if (findings.length > 0) {
    await supabase.from("discrepancies").insert(
      findings.map((f) => ({
        shipment_id: shipmentId,
        owner: user.id,
        severity: f.severity,
        field: f.field,
        doc_a: f.doc_a,
        doc_b: f.doc_b,
        value_a: f.value_a,
        value_b: f.value_b,
        message: f.message,
      }))
    );
  }
  await supabase.from("events").insert({
    owner: user.id,
    type: "check_run",
    payload: {
      shipment_id: shipmentId,
      docs: shipmentDocs.length,
      findings: findings.length,
    },
  });
  revalidatePath(`/app/shipments/${shipmentId}`);
}

export async function resolveDiscrepancy(formData: FormData) {
  const id = String(formData.get("discrepancyId") ?? "");
  const winner = String(formData.get("winner") ?? ""); // 'a' | 'b' | 'dismiss'
  if (!id || !["a", "b", "dismiss"].includes(winner)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: disc } = await supabase
    .from("discrepancies")
    .select("id, shipment_id, field, doc_a, doc_b, value_a, value_b, resolved")
    .eq("id", id)
    .maybeSingle();
  if (!disc || disc.resolved) return;

  if (winner !== "dismiss") {
    const losingId = winner === "a" ? disc.doc_b : disc.doc_a;
    const winningValue = winner === "a" ? disc.value_a : disc.value_b;
    if (losingId && winningValue !== null) {
      const { data: losing } = await supabase
        .from("documents")
        .select("id, doc_type, fields")
        .eq("id", losingId)
        .maybeSingle();
      const path = losing ? correctionPath(disc.field, losing.doc_type) : null;
      if (losing?.fields && path) {
        const next = setPath(
          losing.fields as Record<string, unknown>,
          path,
          coerceCorrection(path, winningValue)
        );
        await supabase.from("documents").update({ fields: next }).eq("id", losingId);
        await supabase.from("events").insert({
          owner: user.id,
          type: "discrepancy_correction",
          payload: {
            discrepancy_id: id,
            document_id: losingId,
            field: path,
            value: winningValue,
          },
        });
      }
    }
  }

  await supabase.from("discrepancies").update({ resolved: true }).eq("id", id);
  await supabase.from("events").insert({
    owner: user.id,
    type: "discrepancy_resolved",
    payload: { discrepancy_id: id, winner },
  });
  revalidatePath(`/app/shipments/${disc.shipment_id}`);
}
