"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

const MEASUREMENT_ID = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-H3XT47WGSF").trim();

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Keep operational route insight without sending private record identifiers. */
function analyticsPath(pathname: string) {
  return pathname
    .replace(/^\/app\/review\/[^/]+/, "/app/review/:document")
    .replace(/^\/app\/generate\/[^/]+/, "/app/generate/:document")
    .replace(/^\/app\/shipments\/[^/]+/, "/app/shipments/:shipment")
    .replace(/^\/share\/[^/]+/, "/share/:token");
}

/**
 * gtag.js only reads a dataLayer entry as a command when it is a real
 * `arguments` object; a plain array is parsed as a legacy "object.method" call
 * and silently discarded. So the queue shim must forward `arguments` itself —
 * a rest/spread arrow function pushes an Array and loses every hit.
 */
function ensureGtag(): (...args: unknown[]) => void {
  window.dataLayer = window.dataLayer || [];
  const existing = window.gtag;
  if (existing) return existing;
  const gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag = gtag;
  return gtag;
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const configured = useRef(false);

  // The shim queues into dataLayer, so commands survive being issued before
  // gtag.js finishes loading; no need to wait on the script's ready callback.
  useEffect(() => {
    if (!MEASUREMENT_ID) return;
    const gtag = ensureGtag();

    if (!configured.current) {
      configured.current = true;
      gtag("js", new Date());
      gtag("config", MEASUREMENT_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }

    const safePath = analyticsPath(pathname);
    gtag("event", "page_view", {
      page_location: `${window.location.origin}${safePath}`,
      page_title: document.title,
    });
  }, [pathname]);

  if (!MEASUREMENT_ID) return null;

  return <Script id="gainingdocx-google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`} strategy="afterInteractive" />;
}
