// Long-form editorial content for the /templates/[slug] pages, grouped by
// document family. The route component reads only TEMPLATE_DEEP.

import type { DeepContentMap } from "@/content/deep/types";
import { COMMERCIAL_TEMPLATE_DEEP } from "@/content/deep/templates/commercial";
import { PACKING_TEMPLATE_DEEP } from "@/content/deep/templates/packing";
import { TRANSPORT_TEMPLATE_DEEP } from "@/content/deep/templates/transport";

export const TEMPLATE_DEEP: DeepContentMap = {
  ...TRANSPORT_TEMPLATE_DEEP,
  ...COMMERCIAL_TEMPLATE_DEEP,
  ...PACKING_TEMPLATE_DEEP,
};
