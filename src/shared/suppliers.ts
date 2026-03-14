import { readFileSync } from "node:fs";

import type { SearchPlan, SupplierDefinition } from "./types.js";

const BUILTIN_SUPPLIERS: SupplierDefinition[] = [
  {
    id: "mcmaster",
    name: "McMaster-Carr",
    homepage: "https://www.mcmaster.com/",
    domain: "mcmaster.com",
    aliases: ["mcmaster-carr", "mcmaster carr"],
    mode: "hybrid",
    browserPreferred: false,
    searchUrlTemplate: "https://www.mcmaster.com/products/{querySlug}/",
    productUrlTemplate: "https://www.mcmaster.com/{partNumber}",
    notes:
      "Supports public catalog browsing. Approved customers can optionally enrich part-number lookups through the McMaster Product Information API.",
  },
  {
    id: "grainger",
    name: "Grainger",
    homepage: "https://www.grainger.com/",
    domain: "grainger.com",
    mode: "search-engine",
    browserPreferred: true,
    searchUrlTemplate: "https://www.grainger.com/search?searchQuery={query}",
    notes:
      "Public HTML search exists, but result quality varies. Prefer site-search results and browser follow-up for final validation.",
  },
  {
    id: "amazon",
    name: "Amazon",
    homepage: "https://www.amazon.com/",
    domain: "amazon.com",
    aliases: ["amazon us"],
    mode: "search-engine",
    browserPreferred: true,
    searchUrlTemplate: "https://www.amazon.com/s?k={query}",
    notes:
      "Raw HTTP frequently returns anti-bot pages. Use search-engine discovery and Playwright for reliable trace-through.",
  },
  {
    id: "digikey",
    name: "DigiKey",
    homepage: "https://www.digikey.com/",
    domain: "digikey.com",
    aliases: ["digi-key", "digi key"],
    mode: "search-engine",
    browserPreferred: true,
    searchUrlTemplate: "https://www.digikey.com/en/products/result?keywords={query}",
    notes:
      "Raw HTTP often hits challenge pages. Search-engine discovery works better for initial trace; verify product pages in browser.",
  },
  {
    id: "uline",
    name: "ULINE",
    homepage: "https://www.uline.com/",
    domain: "uline.com",
    mode: "search-engine",
    browserPreferred: true,
    searchUrlTemplate: "https://www.uline.com/Product/AdvSearchResult?keywords={query}",
    notes:
      "Direct search endpoints are challenge-protected. Search-engine discovery is more reliable than blind HTTP scraping.",
  },
];

function slugifyQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function applyTemplate(template: string, query: string): string {
  const encoded = encodeURIComponent(query.trim());
  return template
    .replaceAll("{query}", encoded)
    .replaceAll("{querySlug}", slugifyQuery(query))
    .replaceAll("{partNumber}", encodeURIComponent(query.trim()));
}

function parseExtraSuppliers(): SupplierDefinition[] {
  const jsonPath = process.env.SUPPLIER_EXTRA_CATALOGS_PATH;
  const jsonInline = process.env.SUPPLIER_EXTRA_CATALOGS_JSON;
  const raw = jsonInline ?? (jsonPath ? readFileSync(jsonPath, "utf8") : "");

  if (!raw.trim()) {
    return [];
  }

  const parsed = JSON.parse(raw) as SupplierDefinition[];
  return parsed.filter(
    (entry) => Boolean(entry.id && entry.name && entry.homepage && entry.domain),
  );
}

export function loadSuppliers(): SupplierDefinition[] {
  return [...BUILTIN_SUPPLIERS, ...parseExtraSuppliers()];
}

export function resolveSupplier(input: string): SupplierDefinition | undefined {
  const normalized = input.trim().toLowerCase();

  return loadSuppliers().find((supplier) => {
    if (supplier.id === normalized) {
      return true;
    }

    return supplier.aliases?.some((alias) => alias.toLowerCase() === normalized);
  });
}

export function listSupplierSummaries() {
  return loadSuppliers().map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
    homepage: supplier.homepage,
    domain: supplier.domain,
    mode: supplier.mode,
    browserPreferred: supplier.browserPreferred ?? false,
    notes: supplier.notes,
  }));
}

export function looksLikePartNumber(query: string): boolean {
  return /^[a-z0-9][a-z0-9._/-]{2,}$/i.test(query.trim()) && /\d/.test(query);
}

export function buildSiteSearchUrl(supplier: SupplierDefinition, query: string): string {
  return `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
    `site:${supplier.domain} ${query.trim()}`,
  )}`;
}

export function buildSearchPlan(
  supplier: SupplierDefinition,
  query: string,
): SearchPlan {
  const searchUrl = supplier.searchUrlTemplate
    ? applyTemplate(supplier.searchUrlTemplate, query)
    : buildSiteSearchUrl(supplier, query);
  const directPartUrl =
    supplier.productUrlTemplate && looksLikePartNumber(query)
      ? applyTemplate(supplier.productUrlTemplate, query)
      : undefined;

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    searchUrl,
    siteSearchUrl: buildSiteSearchUrl(supplier, query),
    directPartUrl,
    browserPreferred: supplier.browserPreferred ?? false,
    notes: supplier.notes,
  };
}
