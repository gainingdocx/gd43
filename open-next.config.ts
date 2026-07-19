import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal M0 config: no incremental cache override yet.
// When marketing ISR pages land (M1+), add the R2 incremental cache per
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig();
