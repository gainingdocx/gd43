"use client";

const VISITOR_KEY = "gainingdocx_visitor_id";
const SESSION_KEY = "gainingdocx_session_id";

function readOrCreate(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const value = crypto.randomUUID();
  storage.setItem(key, value);
  return value;
}

export function getAnalyticsIdentity() {
  return {
    visitorId: readOrCreate(window.localStorage, VISITOR_KEY),
    sessionId: readOrCreate(window.sessionStorage, SESSION_KEY),
  };
}

export function safeAnalyticsPath(pathname: string): string {
  return pathname
    .replace(/^\/app\/review\/[^/]+/, "/app/review/:document")
    .replace(/^\/app\/generate\/[^/]+/, "/app/generate/:document")
    .replace(/^\/app\/shipments\/[^/]+/, "/app/shipments/:shipment")
    .replace(/^\/share\/[^/]+/, "/share/:token")
    .slice(0, 500);
}

export function featureForPath(pathname: string): string {
  if (pathname === "/") return "Homepage";
  if (pathname.startsWith("/tools/")) return "Shipping calculators";
  if (pathname === "/tools") return "Tools directory";
  if (pathname.startsWith("/templates/")) return "Document templates";
  if (pathname === "/templates") return "Templates directory";
  if (pathname.startsWith("/guides/")) return "Shipping guides";
  if (pathname === "/guides") return "Guides directory";
  if (pathname.startsWith("/features/")) return "Feature education";
  if (pathname.includes("-parser")) return "Document parser pages";
  if (pathname.startsWith("/app/scan")) return "Document upload";
  if (pathname.startsWith("/app/review")) return "Document review";
  if (pathname.startsWith("/app/generate")) return "Document generation";
  if (pathname.startsWith("/app/shipments")) return "Shipment workspace";
  if (pathname.startsWith("/app/search")) return "Document search";
  if (pathname.startsWith("/app/integrations")) return "API integrations";
  if (pathname.startsWith("/app/account")) return "Account management";
  if (pathname.startsWith("/app/admin")) return "Admin dashboard";
  if (pathname.startsWith("/app")) return "User workspace";
  if (pathname.startsWith("/pricing")) return "Pricing";
  if (pathname.startsWith("/auth")) return "Authentication";
  if (pathname.startsWith("/share")) return "Shared documents";
  if (pathname.startsWith("/contact")) return "Contact";
  if (pathname.startsWith("/about")) return "About";
  return "Other pages";
}

export function trackFeatureUse(feature: string, path = window.location.pathname) {
  const identity = getAnalyticsIdentity();
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "feature_use",
      feature: feature.slice(0, 100),
      path: safeAnalyticsPath(path),
      ...identity,
      deviceType: deviceType(),
      language: navigator.language,
    }),
    keepalive: true,
  });
}

export function deviceType(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1100) return "tablet";
  return "desktop";
}
