# Part Searcher

Local MCP servers and a Codex skill for tracing parts across supplier catalogs such as McMaster-Carr, Grainger, Amazon, DigiKey, and ULINE.

## What is included

- `supplier-catalog` MCP server for supplier metadata and search planning
- `supplier-scraper` MCP server for site-search discovery and product page snapshots
- `skills/supplier-catalog-tracer` for Codex orchestration across MCP plus Playwright

## Quick start

```bash
npm install
npm run build
bash scripts/install-to-codex.sh
```

Then add the generated MCP entries to `/Users/guillaume/.codex/config.toml`.

## Optional McMaster API support

McMaster-Carr exposes an official Product Information API for approved customers. The scraper server uses it only when these variables are set:

```bash
export MCMASTER_API_USERNAME="..."
export MCMASTER_API_PASSWORD="..."
export MCMASTER_API_PFX_PATH="/absolute/path/to/client-certificate.pfx"
export MCMASTER_API_PFX_PASSPHRASE="..."
```

## Extending supplier coverage

Set `SUPPLIER_EXTRA_CATALOGS_JSON` or `SUPPLIER_EXTRA_CATALOGS_PATH` to a JSON array of supplier definitions:

```json
[
  {
    "id": "fastenal",
    "name": "Fastenal",
    "homepage": "https://www.fastenal.com/",
    "domain": "fastenal.com",
    "mode": "search-engine",
    "browserPreferred": true,
    "searchUrlTemplate": "https://www.fastenal.com/search?query={query}"
  }
]
```
