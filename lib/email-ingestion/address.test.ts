import assert from "node:assert/strict";
import test from "node:test";

import { addressToken, emailInAddress, senderAddress } from "./address.ts";

test("builds and routes a private email-in address", () => {
  const token = "1234567890abcdef1234567890abcdef";
  assert.equal(emailInAddress(token, "docs.example.com"), `${token}@docs.example.com`);
  assert.equal(addressToken([`GainingDocx <${token}@docs.example.com>`], "docs.example.com"), token);
  assert.equal(addressToken([`${token}@wrong.example.com`], "docs.example.com"), null);
});

test("normalizes sender mailboxes", () => {
  assert.equal(senderAddress("Ops Team <DOCS@Forwarder.com>"), "docs@forwarder.com");
  assert.equal(senderAddress("docs@forwarder.com"), "docs@forwarder.com");
  assert.equal(senderAddress("not an email"), null);
});
