// GET /v1/openapi.json — the machine-readable contract.
//
// Published so customers can generate clients, import the API into Postman or
// Insomnia, and diff it between releases. It is hand-maintained alongside the
// routes; when an endpoint changes, this changes in the same commit.

import { preflight } from "@/lib/api/respond";
import { RATE_LIMIT, RATE_WINDOW_SECONDS } from "@/lib/api/auth";

const SERVER = "https://gainingdocx.com/api/v1";

const errorResponse = {
  description: "Error",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
};

const spec = {
  openapi: "3.1.0",
  info: {
    title: "GainingDocx API",
    version: "1.0.0",
    description:
      "Extract, validate and reconcile freight documents programmatically. " +
      "All endpoints are authenticated with a Bearer API key created in your workspace under Integrations. " +
      `Requests are limited to ${RATE_LIMIT} per ${RATE_WINDOW_SECONDS} seconds per key; every response carries ` +
      "`X-RateLimit-Remaining` and `X-Request-Id`. API keys are secret — never ship one in browser or mobile code.",
    contact: { name: "GainingDocx support", email: "gainingdocx@gmail.com", url: "https://gainingdocx.com/contact" },
    license: { name: "Proprietary", url: "https://gainingdocx.com/terms" },
  },
  servers: [{ url: SERVER, description: "Production" }],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Account", description: "Verify a key and inspect quota." },
    { name: "Documents", description: "Parse, retrieve and manage documents." },
    { name: "Tools", description: "Stateless freight calculations and reference validation." },
    { name: "Content", description: "Search GainingDocx reference material." },
  ],
  paths: {
    "/me": {
      get: {
        tags: ["Account"],
        summary: "Retrieve the authenticated account",
        description: "Verifies the API key and returns the plan, key metadata and remaining quota.",
        operationId: "getMe",
        responses: {
          "200": { description: "Account details", content: { "application/json": { schema: { type: "object" } } } },
          "401": errorResponse,
          "429": errorResponse,
        },
      },
    },
    "/documents": {
      get: {
        tags: ["Documents"],
        summary: "List documents",
        operationId: "listDocuments",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["uploaded", "parsing", "parsed", "failed"] } },
          { name: "document_type", in: "query", schema: { type: "string" } },
          { name: "shipment_id", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "A paginated list of documents",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DocumentList" } } },
          },
          "401": errorResponse,
          "429": errorResponse,
        },
      },
    },
    "/documents/{documentId}": {
      parameters: [{ name: "documentId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Documents"],
        summary: "Retrieve a document",
        description: "Returns the document including extracted `fields` and `validation` findings.",
        operationId: "getDocument",
        responses: {
          "200": { description: "The document", content: { "application/json": { schema: { $ref: "#/components/schemas/Document" } } } },
          "404": errorResponse,
          "401": errorResponse,
        },
      },
      delete: {
        tags: ["Documents"],
        summary: "Delete a document",
        description: "Permanently deletes the document and its extracted data. This cannot be undone.",
        operationId: "deleteDocument",
        responses: {
          "200": { description: "Deletion confirmation", content: { "application/json": { schema: { type: "object" } } } },
          "404": errorResponse,
          "401": errorResponse,
        },
      },
    },
    "/parse": {
      post: {
        tags: ["Documents"],
        summary: "Parse a document",
        description:
          "Extracts structured data from document page images. Pages may be HTTPS URLs or base64 `data:` URLs. " +
          "Synchronous; large documents can take up to two minutes.",
        operationId: "parseDocument",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pages"],
                properties: {
                  pages: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      properties: { url: { type: "string", format: "uri" }, data_url: { type: "string" } },
                    },
                  },
                  document_type: { type: "string", description: "Optional hint; detection runs regardless." },
                  shipment_id: { type: "string", format: "uuid" },
                  source_filename: { type: "string" },
                  target_language: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Parsed document", content: { "application/json": { schema: { $ref: "#/components/schemas/Document" } } } },
          "400": errorResponse,
          "401": errorResponse,
          "502": errorResponse,
        },
      },
    },
    "/tools/volume": {
      post: {
        tags: ["Tools"],
        summary: "Calculate CBM and chargeable weight",
        description:
          "Totals volume across package groups and compares actual against volumetric weight, reporting which one rates.",
        operationId: "calculateVolume",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["groups"],
                properties: {
                  groups: {
                    type: "array",
                    minItems: 1,
                    items: {
                      type: "object",
                      required: ["length", "width", "height"],
                      properties: {
                        length: { type: "number" }, width: { type: "number" }, height: { type: "number" },
                        quantity: { type: "number", default: 1 }, gross_weight: { type: "number" },
                      },
                    },
                  },
                  unit: { type: "string", enum: ["mm", "cm", "m", "in"], default: "cm" },
                  weight_unit: { type: "string", enum: ["kg", "lb"], default: "kg" },
                  divisor: { type: "number", default: 6000, description: "6000 general air cargo, 5000 express." },
                  divisor_basis: { type: "string", enum: ["cm3_per_kg", "in3_per_lb"], default: "cm3_per_kg" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Calculation", content: { "application/json": { schema: { type: "object" } } } }, "400": errorResponse },
      },
    },
    "/tools/validate-reference": {
      post: {
        tags: ["Tools"],
        summary: "Validate container, AWB or port references",
        description:
          "Batch-checks ISO 6346 container check digits, IATA modulus-7 AWB check digits, or resolves UN/LOCODE ports. " +
          "Returns the expected check digit on failure so a typo can be distinguished from a fabricated number.",
        operationId: "validateReference",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "values"],
                properties: {
                  type: { type: "string", enum: ["container", "awb", "port"] },
                  values: { type: "array", minItems: 1, maxItems: 200, items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Validation results", content: { "application/json": { schema: { type: "object" } } } }, "400": errorResponse },
      },
    },
    "/tools/freight-charges": {
      post: {
        tags: ["Tools"],
        summary: "Calculate LCL freight or demurrage and detention",
        operationId: "calculateFreightCharges",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["calculation"],
                properties: {
                  calculation: { type: "string", enum: ["lcl_wm", "free_time"] },
                  cbm: { type: "number" }, gross_kg: { type: "number" }, rate_per_revenue_ton: { type: "number" },
                  minimum_revenue_tons: { type: "number", default: 1 },
                  origin_charges: { type: "number" }, destination_charges: { type: "number" }, other_charges: { type: "number" },
                  start_date: { type: "string", format: "date" }, end_date: { type: "string", format: "date" },
                  free_days: { type: "number" }, first_tier_days: { type: "number" },
                  first_tier_daily_rate: { type: "number" }, second_tier_daily_rate: { type: "number" },
                  fixed_charges: { type: "number" },
                  day_basis: { type: "string", enum: ["calendar", "weekdays"], default: "calendar" },
                  include_start_date: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Calculation", content: { "application/json": { schema: { type: "object" } } } }, "400": errorResponse },
      },
    },
    "/content/search": {
      get: {
        tags: ["Content"],
        summary: "Search GainingDocx reference content",
        description: "Searches guides, tools, templates and their answers. Trade shorthand such as B/L, AWB and VGM is understood.",
        operationId: "searchContent",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 2, maxLength: 120 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 40, default: 10 } },
          {
            name: "kind", in: "query",
            schema: { type: "string", enum: ["answer", "tool", "template", "parser", "feature", "guide", "hub", "page"] },
          },
        ],
        responses: { "200": { description: "Results", content: { "application/json": { schema: { type: "object" } } } }, "400": errorResponse },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "An API key from your workspace Integrations page, sent as `Authorization: Bearer gdx_live_...`.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            required: ["type", "code", "message", "request_id"],
            properties: {
              type: {
                type: "string",
                enum: ["authentication_error", "invalid_request_error", "not_found_error", "rate_limit_error", "api_error"],
              },
              code: { type: "string", description: "Stable machine-readable code." },
              message: { type: "string", description: "Human-readable description; wording may change." },
              param: { type: "string", description: "The offending input, when one can be identified." },
              request_id: { type: "string", description: "Quote this when contacting support." },
            },
          },
        },
      },
      Document: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          object: { type: "string", const: "document" },
          shipment_id: { type: ["string", "null"], format: "uuid" },
          document_type: { type: "string" },
          status: { type: "string", enum: ["uploaded", "parsing", "parsed", "failed"] },
          page_count: { type: ["integer", "null"] },
          source_filename: { type: ["string", "null"] },
          fields: { type: ["object", "null"], description: "Extracted data. Present on retrieve, omitted from lists." },
          validation: { type: ["array", "object", "null"], description: "Deterministic validation findings." },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      DocumentList: {
        type: "object",
        properties: {
          object: { type: "string", const: "list" },
          data: { type: "array", items: { $ref: "#/components/schemas/Document" } },
          has_more: { type: "boolean" },
          total_count: { type: "integer" },
        },
      },
    },
  },
} as const;

export const OPTIONS = preflight;

export async function GET() {
  return Response.json(spec, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      // The spec only changes on deploy.
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
