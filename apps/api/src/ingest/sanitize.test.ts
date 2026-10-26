import { describe, expect, it } from "vitest";
import { sanitizeDescription } from "./sanitize";

// Synthetic attacks (not from the fixtures).
describe("sanitizeDescription", () => {
  it("removes scripts, event handlers, styles, iframes and javascript: links", () => {
    const dirty = [
      "<p onclick=\"steal()\" style=\"color:red\">Hello <b>world</b></p>",
      "<script>alert(1)</script><style>body{}</style>",
      "<iframe src=\"https://evil.example\"></iframe><img src=x onerror=alert(1)>",
      "<a href=\"javascript:alert(1)\">bad</a> <a href=\"https://example.com\">good</a>",
    ].join("");
    expect(sanitizeDescription(dirty)).toBe(
      '<p>Hello <b>world</b></p><a target="_blank" rel="noopener noreferrer nofollow">bad</a> ' +
        '<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">good</a>',
    );
  });

  it("decodes entity-escaped HTML before sanitizing, so escaped tags are not smuggled through", () => {
    const escaped = "&lt;p&gt;Hi&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;";
    expect(sanitizeDescription(escaped, { entityEncoded: true })).toBe("<p>Hi</p>");
  });

  it("keeps text from removed wrapper tags and drops empty blocks", () => {
    expect(sanitizeDescription("<div><span>Kept</span></div><p> </p><h1>Title</h1>")).toBe("Kept<h2>Title</h2>");
  });
});
