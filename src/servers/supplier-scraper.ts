import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { extractDuckDuckGoResults, extractGenericLinks, extractProductSnapshot, detectBlockedResponse } from "../shared/extract.js";
import { fetchText } from "../shared/http.js";
import { McmasterApiClient } from "../shared/mcmaster.js";
import { jsonContent, startServer } from "../shared/mcp.js";
import { buildSearchPlan, listSupplierSummaries, looksLikePartNumber, resolveSupplier } from "../shared/suppliers.js";
import type { ScrapeEnvelope } from "../shared/types.js";

const server = new McpServer({
  name: "supplier-scraper",
  version: "0.1.0",
});

function blockedEnvelope(
  supplierId: string,
  strategy: string,
  requestedUrl: string,
  reason: string,
) {
  const payload: ScrapeEnvelope<never[]> = {
    ok: false,
    supplierId,
    strategy,
    requestedUrl,
    blocked: true,
    reason,
    data: [],
  };

  return jsonContent(payload);
}

server.tool(
  "search_supplier_catalog",
  {
    supplier: z.string().describe("Supplier id or alias."),
    query: z.string().describe("Part number or descriptive query."),
    limit: z.number().int().min(1).max(10).default(5),
    preferSearchEngine: z.boolean().default(false),
  },
  async ({ supplier, query, limit, preferSearchEngine }) => {
    const match = resolveSupplier(supplier);

    if (!match) {
      return jsonContent({
        error: `Unknown supplier: ${supplier}`,
        availableSuppliers: listSupplierSummaries().map((item) => item.id),
      });
    }

    const plan = buildSearchPlan(match, query);
    const useSearchEngine = preferSearchEngine || match.mode === "search-engine";

    if (match.id === "mcmaster" && looksLikePartNumber(query)) {
      const apiClient = McmasterApiClient.fromEnv();

      if (apiClient) {
        try {
          const [product, price] = await Promise.all([
            apiClient.getProduct(query),
            apiClient.getPrice(query),
          ]);

          return jsonContent({
            ok: true,
            supplierId: match.id,
            strategy: "mcmaster-api",
            requestedUrl: plan.directPartUrl ?? plan.searchUrl,
            data: {
              product,
              price,
            },
          });
        } catch (error) {
          return jsonContent({
            ok: false,
            supplierId: match.id,
            strategy: "mcmaster-api",
            requestedUrl: plan.directPartUrl ?? plan.searchUrl,
            reason:
              error instanceof Error ? error.message : "McMaster API request failed",
            fallback: "Retry without API credentials or use Playwright for public catalog browsing.",
            data: [],
          });
        }
      }
    }

    const targetUrl = useSearchEngine ? plan.siteSearchUrl : plan.searchUrl;
    const strategy = useSearchEngine ? "site-search" : "direct-search";
    const response = await fetchText(targetUrl);
    const blocked = detectBlockedResponse(response.text, response.status);

    if (blocked.blocked) {
      return blockedEnvelope(match.id, strategy, targetUrl, blocked.reason ?? "blocked");
    }

    const results = useSearchEngine
      ? extractDuckDuckGoResults(response.text, limit)
      : extractGenericLinks(response.text, limit, match.domain);

    return jsonContent({
      ok: true,
      supplierId: match.id,
      strategy,
      requestedUrl: targetUrl,
      finalUrl: response.url,
      browserRecommended: match.browserPreferred ?? false,
      results,
      plan,
    });
  },
);

server.tool(
  "trace_multi_supplier",
  {
    query: z.string().describe("Part number or descriptive query."),
    suppliers: z
      .array(z.string())
      .optional()
      .describe("Optional supplier ids or aliases. Defaults to all built-in suppliers."),
    limitPerSupplier: z.number().int().min(1).max(5).default(3),
  },
  async ({ query, suppliers, limitPerSupplier }) => {
    const supplierIds = suppliers?.length
      ? suppliers
      : listSupplierSummaries().map((supplier) => supplier.id);

    const traces = [];

    for (const supplierId of supplierIds) {
      const match = resolveSupplier(supplierId);
      if (!match) {
        continue;
      }

      const plan = buildSearchPlan(match, query);
      const targetUrl = match.mode === "direct" ? plan.searchUrl : plan.siteSearchUrl;
      const strategy = match.mode === "direct" ? "direct-search" : "site-search";

      try {
        const response = await fetchText(targetUrl);
        const blocked = detectBlockedResponse(response.text, response.status);

        traces.push({
          supplierId: match.id,
          supplierName: match.name,
          strategy,
          requestedUrl: targetUrl,
          blocked: blocked.blocked,
          reason: blocked.reason,
          browserRecommended: match.browserPreferred ?? false,
          results: blocked.blocked
            ? []
            : extractDuckDuckGoResults(response.text, limitPerSupplier),
        });
      } catch (error) {
        traces.push({
          supplierId: match.id,
          supplierName: match.name,
          strategy,
          requestedUrl: targetUrl,
          blocked: true,
          reason: error instanceof Error ? error.message : "request failed",
          browserRecommended: true,
          results: [],
        });
      }
    }

    return jsonContent({
      query,
      traces,
    });
  },
);

server.tool(
  "fetch_supplier_page",
  {
    supplier: z.string().describe("Supplier id or alias."),
    url: z.string().url().optional().describe("Specific product or result URL to fetch."),
    query: z.string().optional().describe("Optional part number used to infer a direct part URL."),
  },
  async ({ supplier, url, query }) => {
    const match = resolveSupplier(supplier);

    if (!match) {
      return jsonContent({
        error: `Unknown supplier: ${supplier}`,
        availableSuppliers: listSupplierSummaries().map((item) => item.id),
      });
    }

    const targetUrl = url ?? (query ? buildSearchPlan(match, query).directPartUrl : undefined);

    if (!targetUrl) {
      return jsonContent({
        error: "Provide either url or a part-number-like query.",
      });
    }

    const response = await fetchText(targetUrl);
    const blocked = detectBlockedResponse(response.text, response.status);

    if (blocked.blocked) {
      return blockedEnvelope(match.id, "page-fetch", targetUrl, blocked.reason ?? "blocked");
    }

    return jsonContent({
      ok: true,
      supplierId: match.id,
      strategy: "page-fetch",
      requestedUrl: targetUrl,
      finalUrl: response.url,
      browserRecommended: match.browserPreferred ?? false,
      snapshot: extractProductSnapshot(response.text, response.url),
    });
  },
);

startServer(server).catch((error) => {
  console.error(error);
  process.exit(1);
});
