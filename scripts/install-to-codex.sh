#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_NAME="supplier-catalog-tracer"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
SKILL_TARGET="$CODEX_HOME/skills/$SKILL_NAME"
CONFIG_FILE="$CODEX_HOME/config.toml"

mkdir -p "$CODEX_HOME/skills"

npm install
npm run build

ln -sfn "$ROOT_DIR/skills/$SKILL_NAME" "$SKILL_TARGET"

cat <<EOF
Installed skill symlink:
  $SKILL_TARGET -> $ROOT_DIR/skills/$SKILL_NAME

Add these entries to $CONFIG_FILE:

[mcp_servers.supplier_catalog]
command = "node"
args = ["$ROOT_DIR/dist/src/servers/supplier-catalog.js"]

[mcp_servers.supplier_scraper]
command = "node"
args = ["$ROOT_DIR/dist/src/servers/supplier-scraper.js"]

Optional env vars:
  MCMASTER_API_USERNAME
  MCMASTER_API_PASSWORD
  MCMASTER_API_PFX_PATH
  MCMASTER_API_PFX_PASSPHRASE
  SUPPLIER_EXTRA_CATALOGS_JSON
  SUPPLIER_EXTRA_CATALOGS_PATH
EOF
