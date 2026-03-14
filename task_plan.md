# Task Plan: Supplier Catalog MCP and Skill

## Goal
Create a reusable Codex skill plus local MCP servers that help trace and compare parts across supplier catalogs such as McMaster-Carr, Grainger, Amazon, DigiKey, and ULINE.

## Current Phase
Phase 5

## Phases
### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Define technical approach
- [x] Create project structure
- [x] Document decisions with rationale
- **Status:** complete

### Phase 3: Implementation
- [x] Build MCP servers
- [x] Add supplier skill
- [x] Add install/config workflow
- **Status:** complete

### Phase 4: Testing & Verification
- [x] Run unit tests
- [x] Smoke-test both MCP servers
- [x] Fix issues found
- **Status:** complete

### Phase 5: Delivery
- [x] Review artifacts
- [x] Summarize usage and limits
- [x] Deliver to user
- **Status:** in_progress

## Key Questions
1. Which parts of supplier access can be done without authenticated APIs?
2. How should the skill coordinate static scraping, official APIs, and Playwright fallback?
3. How should Codex install the skill and MCP entries without clobbering existing config?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use a fresh Node/TypeScript project | Empty workspace and MCP SDK support TypeScript well |
| Split into two MCP servers | Keep deterministic URL planning separate from network scraping/fetching |
| Use DuckDuckGo site-search as the cross-supplier discovery fallback | Amazon, DigiKey, Grainger, and ULINE are inconsistent or challenge-protected over raw HTTP |
| Install the skill via symlink into `~/.codex/skills` | Keeps the repo as the source of truth while making the skill immediately available to Codex |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Initial repo scan found no project files | 1 | Confirmed workspace is empty and proceeded with greenfield scaffold |
| TypeScript build failed without Node ambient types | 1 | Added `@types/node` and `types: ["node"]` to the compiler config |

## Notes
- Re-read this plan before major decisions.
- Avoid relying on undocumented private APIs unless they are optional.
