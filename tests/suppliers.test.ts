import { describe, expect, it } from "vitest";

import { detectBlockedResponse, extractDuckDuckGoResults } from "../src/shared/extract.js";
import { buildSearchPlan, resolveSupplier } from "../src/shared/suppliers.js";

describe("supplier planning", () => {
  it("builds a McMaster slug-based search URL", () => {
    const supplier = resolveSupplier("mcmaster");
    expect(supplier).toBeDefined();

    const plan = buildSearchPlan(supplier!, "socket head cap screw");
    expect(plan.searchUrl).toBe(
      "https://www.mcmaster.com/products/socket-head-cap-screw/",
    );
  });

  it("builds a direct part URL when the query looks like a part number", () => {
    const supplier = resolveSupplier("mcmaster");
    expect(supplier).toBeDefined();

    const plan = buildSearchPlan(supplier!, "91290A115");
    expect(plan.directPartUrl).toBe("https://www.mcmaster.com/91290A115");
  });
});

describe("HTML extraction", () => {
  it("detects challenge pages", () => {
    const blocked = detectBlockedResponse(
      "<html><head><title>Just a moment...</title></head></html>",
      403,
    );

    expect(blocked.blocked).toBe(true);
  });

  it("extracts DuckDuckGo result links", () => {
    const html = `
      <div class="results">
        <div class="result">
          <a class="result__a" href="https://www.amazon.com/example-part">Example Part</a>
          <a class="result__snippet">High torque fastener</a>
        </div>
      </div>
    `;

    const results = extractDuckDuckGoResults(html, 3);
    expect(results).toHaveLength(1);
    expect(results[0]?.url).toBe("https://www.amazon.com/example-part");
  });
});
