# Production observability

GainingDocx emits structured JSON logs and keeps Cloudflare Worker invocation
logs enabled. Parsing requests receive two linked identifiers:

- `requestId`: full internal correlation ID, returned as `X-Request-ID`.
- `reference`: short, user-safe support reference shown in failure messages.

Search either value in **Cloudflare > Workers & Pages > gainingdocx >
Observability > Logs**. For a live investigation, use:

```powershell
npx wrangler tail gainingdocx --format pretty --search REFERENCE
```

## Parsing events

- `parse_request_accepted`
- `ocr_attempt_succeeded`
- `ocr_attempt_failed`
- `ocr_quality_retry_succeeded`
- `ocr_quality_retry_failed`
- `parse_request_succeeded`
- `parse_request_failed`
- `parse_request_rejected`

The attempt logs retain the internal provider/model, HTTP status, duration, and
sanitized error. Those details are never sent in browser status or error
messages. Logs intentionally exclude document contents, image data URLs,
signed storage URLs, access tokens, and API keys.

## Site-wide failures

Cloudflare invocation logs record Worker errors across routes. Next.js route
and rendering failures are handled by the global error boundary. It reports a
`client_render_error` event with a support reference, route path, and framework
digest; it does not send page contents or form data.

When investigating a report:

1. Search the user's reference.
2. Locate `parse_request_failed` or `parse_request_rejected`.
3. Follow the same `requestId` through the preceding `ocr_attempt_*` events.
4. Compare HTTP status, provider, model, stream mode, and duration.
5. Confirm whether fallback succeeded before changing routing or retry policy.

