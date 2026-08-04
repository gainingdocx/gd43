// Reference guides added alongside the original search-led set. Grouped by
// subject area so each source file stays reviewable; `content/guides.ts`
// concatenates them into the published GUIDES list.

import type { GuideDefinition } from "@/content/guides";
import { AIR_FINANCE_GUIDES } from "@/content/guides/air-finance";
import { OCEAN_GUIDES } from "@/content/guides/ocean";
import { TRADE_GUIDES } from "@/content/guides/trade";

export const REFERENCE_GUIDES: GuideDefinition[] = [
  ...TRADE_GUIDES,
  ...OCEAN_GUIDES,
  ...AIR_FINANCE_GUIDES,
];
