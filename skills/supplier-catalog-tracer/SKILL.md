---
name: supplier-catalog-tracer
description: Trace parts and comparable products across supplier catalogs such as McMaster-Carr, Grainger, Amazon, DigiKey, Fastenal, MSC, Mouser, and ULINE. Use when the user wants catalog research, part-number lookup, product comparison, supplier cross-reference, or browser-assisted tracing through industrial or ecommerce product libraries.
---

# Supplier Catalog Tracer

Use this skill when the task is about finding, tracing, validating, or comparing parts across supplier catalogs.

## Required tools

- `supplier-catalog` MCP server for supplier metadata and search planning
- `supplier-scraper` MCP server for site-search discovery and product-page snapshots
- `playwright` MCP server when a supplier returns anti-bot or challenge pages, or when final validation needs a real browser session

## Workflow

1. Start with `supplier-catalog.list_suppliers` or `supplier-catalog.plan_catalog_trace` to get the target suppliers and search URLs.
2. Use `supplier-scraper.trace_multi_supplier` for a first pass across multiple catalogs when the user wants broad coverage.
3. Use `supplier-scraper.search_supplier_catalog` for supplier-specific discovery. Prefer site-search mode for Amazon, DigiKey, Grainger, and ULINE.
4. If the scraper reports `blocked: true`, switch to the `playwright` server and open the returned URL in a real browser.
5. Use `supplier-scraper.fetch_supplier_page` on candidate product URLs to extract titles, breadcrumbs, and rough spec tables.
6. Summarize findings with direct URLs, supplier names, part numbers, and any confidence gaps.

## McMaster-Carr API

If McMaster API credentials are configured, the scraper server can enrich direct part-number lookups through the official Product Information API.

Environment variables:

- `MCMASTER_API_USERNAME`
- `MCMASTER_API_PASSWORD`
- `MCMASTER_API_PFX_PATH`
- `MCMASTER_API_PFX_PASSPHRASE` (optional)

If those variables are missing, use public catalog browsing instead.

## Additional suppliers

To add more catalogs without changing code, provide one of these:

- `SUPPLIER_EXTRA_CATALOGS_JSON`
- `SUPPLIER_EXTRA_CATALOGS_PATH`

The value should be a JSON array of supplier definitions with `id`, `name`, `homepage`, `domain`, and usually `searchUrlTemplate`.

## Output expectations

- Always report which supplier pages were directly fetched versus browser-only.
- Call out anti-bot blocks explicitly instead of implying no results exist.
- When the result set is uncertain, say which step still needs browser validation.
