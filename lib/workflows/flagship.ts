export type FlagshipWorkflowKey =
  | "export_document_check"
  | "shipment_document_check"
  | "freight_invoice_audit"
  | "arrival_free_time_control"
  | "air_export_readiness"
  | "air_consolidation_check"
  | "air_freight_invoice_audit"
  | "dangerous_goods_document_check";

export const FLAGSHIP_WORKFLOW_KEYS: FlagshipWorkflowKey[] = [
  "export_document_check",
  "shipment_document_check",
  "freight_invoice_audit",
  "arrival_free_time_control",
  "air_export_readiness",
  "air_consolidation_check",
  "air_freight_invoice_audit",
  "dangerous_goods_document_check",
];

export type WorkflowDocument = {
  id: string;
  doc_type: string;
  status: string;
  fields?: Record<string, unknown> | null;
};

export type WorkflowRoleResult = {
  key: string;
  label: string;
  acceptedTypes: string[];
  present: boolean;
  processing: boolean;
  documentIds: string[];
  derived?: boolean;
};

export type FlagshipWorkflowResult = {
  key: FlagshipWorkflowKey;
  number: number;
  mode: "ocean" | "air" | "multimodal";
  name: string;
  outcome: string;
  sequence: string;
  state: "not_started" | "collecting" | "ready";
  coverage: number;
  completeRoles: number;
  totalRoles: number;
  roles: WorkflowRoleResult[];
};

type RoleSpec = Omit<WorkflowRoleResult, "present" | "processing" | "documentIds"> & {
  derivedFrom?: (document: WorkflowDocument) => boolean;
};

type WorkflowSpec = Omit<FlagshipWorkflowResult, "state" | "coverage" | "completeRoles" | "totalRoles" | "roles"> & { roles: RoleSpec[] };

export const FLAGSHIP_WORKFLOWS: WorkflowSpec[] = [
  {
    key: "export_document_check", number: 1, mode: "ocean", name: "Ocean Export Document Check",
    outcome: "Catch carrier-draft errors before B/L approval.",
    sequence: "Booking confirmation → Shipping instructions → Draft B/L",
    roles: [
      { key: "booking", label: "Booking confirmation", acceptedTypes: ["booking_confirmation"] },
      { key: "shipping_instructions", label: "Shipping instructions", acceptedTypes: ["shipping_instructions"] },
      { key: "draft_bl", label: "Draft Bill of Lading", acceptedTypes: ["bill_of_lading", "sea_waybill"], derivedFrom: (doc) => doc.fields?.document_stage === "draft" },
    ],
  },
  {
    key: "shipment_document_check", number: 2, mode: "multimodal", name: "Shipment Document Check",
    outcome: "Reconcile commercial, packing and origin evidence against an ocean or air transport record.",
    sequence: "B/L or AWB → Commercial invoice → Packing list → Certificate of origin",
    roles: [
      { key: "transport", label: "Bill of Lading or Air Waybill", acceptedTypes: ["bill_of_lading", "sea_waybill", "air_waybill"] },
      { key: "commercial_invoice", label: "Commercial invoice", acceptedTypes: ["commercial_invoice"] },
      { key: "packing_list", label: "Packing list", acceptedTypes: ["packing_list"] },
      { key: "certificate_of_origin", label: "Certificate of origin", acceptedTypes: ["certificate_of_origin"] },
    ],
  },
  {
    key: "freight_invoice_audit", number: 3, mode: "multimodal", name: "Freight Invoice Audit",
    outcome: "Challenge freight charges against agreed routing, shipment evidence and rates.",
    sequence: "Quotation/rate agreement → Transport record → Freight invoice",
    roles: [
      { key: "rate", label: "Quotation or rate agreement", acceptedTypes: ["quotation", "rate_confirmation"] },
      { key: "transport", label: "B/L or AWB", acceptedTypes: ["bill_of_lading", "sea_waybill", "air_waybill"] },
      { key: "freight_invoice", label: "Freight invoice", acceptedTypes: ["freight_invoice"] },
    ],
  },
  {
    key: "arrival_free_time_control", number: 4, mode: "ocean", name: "Ocean Arrival and Free-Time Control",
    outcome: "Track the last free day and test D&D billing against operational events.",
    sequence: "Arrival notice → Container event → Last free day → D&D invoice",
    roles: [
      { key: "arrival_notice", label: "Arrival notice", acceptedTypes: ["arrival_notice"] },
      { key: "container_event", label: "Container event", acceptedTypes: ["container_event"] },
      { key: "last_free_day", label: "Last free day", acceptedTypes: ["arrival_notice"], derived: true, derivedFrom: (doc) => typeof doc.fields?.last_free_day === "string" && doc.fields.last_free_day.trim().length > 0 },
      { key: "dd_invoice", label: "D&D invoice", acceptedTypes: ["demurrage_detention_invoice"] },
    ],
  },
  {
    key: "air_export_readiness", number: 5, mode: "air", name: "Air Export Readiness",
    outcome: "Catch party, airport, piece, weight and handling conflicts before tendering cargo to the airline.",
    sequence: "SLI → AWB → Commercial invoice → Packing list",
    roles: [
      { key: "air_sli", label: "Shipper's Letter of Instruction", acceptedTypes: ["shipper_letter_of_instruction"] },
      { key: "awb", label: "Air Waybill", acceptedTypes: ["air_waybill"] },
      { key: "commercial_invoice", label: "Commercial invoice", acceptedTypes: ["commercial_invoice"] },
      { key: "packing_list", label: "Packing list", acceptedTypes: ["packing_list"] },
    ],
  },
  {
    key: "air_consolidation_check", number: 6, mode: "air", name: "MAWB–HAWB Consolidation Check",
    outcome: "Reconcile every house air waybill to the master route and shipment totals.",
    sequence: "Master AWB → House AWB set → Air cargo manifest",
    roles: [
      { key: "mawb", label: "Master Air Waybill", acceptedTypes: ["air_waybill"], derivedFrom: (doc) => doc.fields?.awb_type === "master" },
      { key: "hawb", label: "House Air Waybill(s)", acceptedTypes: ["air_waybill"], derivedFrom: (doc) => doc.fields?.awb_type === "house" },
      { key: "manifest", label: "Air cargo manifest", acceptedTypes: ["air_cargo_manifest"] },
    ],
  },
  {
    key: "air_freight_invoice_audit", number: 7, mode: "air", name: "Airfreight Invoice Audit",
    outcome: "Compare quoted rates and billed charges against AWB chargeable weight and routing.",
    sequence: "Rate/quotation → AWB → Freight invoice",
    roles: [
      { key: "rate", label: "Quotation or rate agreement", acceptedTypes: ["quotation", "rate_confirmation"] },
      { key: "awb", label: "Air Waybill", acceptedTypes: ["air_waybill"] },
      { key: "freight_invoice", label: "Freight invoice", acceptedTypes: ["freight_invoice"] },
    ],
  },
  {
    key: "dangerous_goods_document_check", number: 8, mode: "air", name: "Air Dangerous Goods Document Check",
    outcome: "Surface missing and conflicting declaration data for qualified dangerous-goods review.",
    sequence: "Dangerous Goods Declaration → AWB → SLI",
    roles: [
      { key: "dgd", label: "Dangerous Goods Declaration", acceptedTypes: ["dangerous_goods_declaration"] },
      { key: "awb", label: "Air Waybill", acceptedTypes: ["air_waybill"] },
      { key: "air_sli", label: "Shipper's Letter of Instruction", acceptedTypes: ["shipper_letter_of_instruction"] },
    ],
  },
];

export function isFlagshipWorkflowKey(value: string | undefined): value is FlagshipWorkflowKey {
  return FLAGSHIP_WORKFLOW_KEYS.includes(value as FlagshipWorkflowKey);
}

export function getFlagshipWorkflow(key: FlagshipWorkflowKey) {
  return FLAGSHIP_WORKFLOWS.find((workflow) => workflow.key === key)!;
}

export function workflowLaunchHref(key: FlagshipWorkflowKey, shipmentId?: string | null) {
  const params = new URLSearchParams({ type: "batch", workflow: key });
  if (shipmentId) params.set("shipment", shipmentId);
  return `/app/scan?${params.toString()}`;
}

export function assessFlagshipWorkflows(documents: WorkflowDocument[]): FlagshipWorkflowResult[] {
  return FLAGSHIP_WORKFLOWS.map((workflow) => {
    const roles = workflow.roles.map((role): WorkflowRoleResult => {
      const candidates = documents.filter((document) => role.acceptedTypes.includes(document.doc_type) && (!role.derivedFrom || role.derivedFrom(document)));
      const parsed = candidates.filter((document) => document.status === "parsed");
      return {
        key: role.key,
        label: role.label,
        acceptedTypes: role.acceptedTypes,
        present: parsed.length > 0,
        processing: !parsed.length && candidates.some((document) => ["uploaded", "parsing"].includes(document.status)),
        documentIds: parsed.map((document) => document.id),
        derived: role.derived,
      };
    });
    const completeRoles = roles.filter((role) => role.present).length;
    const started = roles.some((role) => role.present || role.processing);
    return {
      key: workflow.key,
      number: workflow.number,
      mode: workflow.mode,
      name: workflow.name,
      outcome: workflow.outcome,
      sequence: workflow.sequence,
      roles,
      completeRoles,
      totalRoles: roles.length,
      coverage: Math.round(completeRoles / roles.length * 100),
      state: completeRoles === roles.length ? "ready" : started ? "collecting" : "not_started",
    };
  });
}
