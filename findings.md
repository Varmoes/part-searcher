# Findings & Decisions

## Requirements
- Build a skill for supplier-library tracing.
- Build MCP server support for catalog traversal across McMaster-Carr, Grainger, Amazon, DigiKey, ULINE, and similar suppliers.
- Leave the user with something runnable in Codex, not just conceptual guidance.

## Research Findings
- The current Codex MCP config lives at `/Users/guillaume/.codex/config.toml` and uses `[mcp_servers.<name>]` TOML entries.
- McMaster-Carr has an official Product Information API for approved customers. It supports login, product lookup, price lookup, images, CAD, and datasheets.
- Supplier sites vary widely in bot protection and page rendering. A hybrid approach is needed: deterministic URL planning plus HTTP scraping, with Playwright fallback for dynamic or protected flows.
- Raw HTTP testing showed Amazon returning `503` and DigiKey returning `403` challenge pages.
- ULINE search endpoints are challenge-protected for raw HTTP, while direct ULINE catalog pages can still load.
- DuckDuckGo HTML site-search is reachable and returns supplier-specific links for Amazon and DigiKey.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Keep supplier definitions data-driven | Makes it easy to add more catalogs later |
| Make McMaster API support optional via env vars | Official API is stronger than scraping, but requires approved credentials |
| Use a skill to orchestrate MCP tools with Playwright | Some catalogs are only reliable through real browser navigation |
| Treat ULINE as a first-class built-in supplier | User clarified the supplier name during implementation |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Workspace was empty | Treat task as a fresh greenfield implementation |

## Resources
- Codex MCP config: `/Users/guillaume/.codex/config.toml`
- McMaster-Carr Product Information API: [https://www.mcmaster.com/help/api/](https://www.mcmaster.com/help/api/)
- Codex skill symlink: `/Users/guillaume/.codex/skills/supplier-catalog-tracer`

## Visual/Browser Findings
- McMaster API docs expose product, price, image, CAD, and datasheet endpoints.
- Grainger pages expose a search input in HTML, but reliable extraction will still need request fallbacks because site markup is marketing-heavy and dynamic.
- ULINE search endpoint `/Product/AdvSearchResult` returns a challenge page to raw HTTP clients.
- DuckDuckGo HTML result pages expose `.result__a` links and `.result__snippet` text, which is enough for supplier discovery parsing.
