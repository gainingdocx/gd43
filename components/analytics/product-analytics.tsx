"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  deviceType,
  featureForPath,
  getAnalyticsIdentity,
  safeAnalyticsPath,
  trackFeatureUse,
} from "@/lib/analytics/client";

function referrerHost(): string | null {
  if (!document.referrer) return null;
  try {
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? null : host;
  } catch {
    return null;
  }
}

export function ProductAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    const identity = getAnalyticsIdentity();
    const params = new URLSearchParams(window.location.search);
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "page_view",
        feature: featureForPath(pathname),
        path: safeAnalyticsPath(pathname),
        referrerHost: referrerHost(),
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
        deviceType: deviceType(),
        language: navigator.language,
        ...identity,
      }),
      keepalive: true,
    });
  }, [pathname]);

  useEffect(() => {
    let read50 = false;
    let read90 = false;
    const engagedTimer = window.setTimeout(
      () => trackFeatureUse("Engaged visit · 30 seconds", pathname),
      30_000,
    );
    function trackReadingDepth() {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      if (available <= 0) return;
      const depth = window.scrollY / available;
      if (!read50 && depth >= 0.5) {
        read50 = true;
        trackFeatureUse("Content read · 50%", pathname);
      }
      if (!read90 && depth >= 0.9) {
        read90 = true;
        trackFeatureUse("Content read · 90%", pathname);
      }
    }
    window.addEventListener("scroll", trackReadingDepth, { passive: true });
    trackReadingDepth();
    return () => {
      window.clearTimeout(engagedTimer);
      window.removeEventListener("scroll", trackReadingDepth);
    };
  }, [pathname]);

  useEffect(() => {
    function trackTaggedInteraction(event: MouseEvent) {
      const element = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-analytics-feature]",
      );
      const feature = element?.dataset.analyticsFeature;
      if (feature) trackFeatureUse(feature);
    }

    document.addEventListener("click", trackTaggedInteraction);
    return () => document.removeEventListener("click", trackTaggedInteraction);
  }, []);

  return null;
}
