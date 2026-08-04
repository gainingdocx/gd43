// Long-form editorial content for the /tools/[slug] pages, split by freight
// mode so each source file stays reviewable. The route component reads only
// TOOL_DEEP.

import type { DeepContentMap } from "@/content/deep/types";
import { AIR_TOOL_DEEP } from "@/content/deep/tools/air";
import { OCEAN_TOOL_DEEP } from "@/content/deep/tools/ocean";
import { TRADE_TOOL_DEEP } from "@/content/deep/tools/trade";

export const TOOL_DEEP: DeepContentMap = {
  ...OCEAN_TOOL_DEEP,
  ...AIR_TOOL_DEEP,
  ...TRADE_TOOL_DEEP,
};
