// Long-form editorial content for the parser landing pages served from
// `app/(marketing)/[slug]`. Grouped by document family; the route component
// reads only PARSER_DEEP.

import type { DeepContentMap } from "@/content/deep/types";
import { AIR_PARSER_DEEP } from "@/content/deep/parsers/air";
import { COMMERCIAL_PARSER_DEEP } from "@/content/deep/parsers/commercial";
import { OCEAN_PARSER_DEEP } from "@/content/deep/parsers/ocean";

export const PARSER_DEEP: DeepContentMap = {
  ...OCEAN_PARSER_DEEP,
  ...COMMERCIAL_PARSER_DEEP,
  ...AIR_PARSER_DEEP,
};
