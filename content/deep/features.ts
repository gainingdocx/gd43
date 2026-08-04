// Long-form editorial content for the /features/[slug] pages. The route
// component reads only FEATURE_DEEP.

import type { DeepContentMap } from "@/content/deep/types";
import { AIR_INTAKE_FEATURE_DEEP } from "@/content/deep/features/air-intake";
import { CORE_FEATURE_DEEP } from "@/content/deep/features/core";

export const FEATURE_DEEP: DeepContentMap = {
  ...CORE_FEATURE_DEEP,
  ...AIR_INTAKE_FEATURE_DEEP,
};
