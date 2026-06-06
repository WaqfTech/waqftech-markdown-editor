#!/usr/bin/env bash
# Deploy the cf-demo to Cloudflare Pages.
#
# Usage:
#   ./scripts/deployDemo.sh              # install → build → deploy (uses version in package.json)
#   ./scripts/deployDemo.sh --update     # upgrade @waqftech/markdown-editor to @latest first
#
# Prerequisites (checked automatically):
#   1. wrangler authenticated  — run `wrangler login` if not
#   2. npm package published   — run `npm publish --access public` from repo root if not
#   3. npm ≥ 18, node ≥ 18
#
# Environment:
#   CLOUDFLARE_API_TOKEN  (optional) skips interactive wrangler auth in CI

set -euo pipefail
IFS=$'\n\t'

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC}    $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}    $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC}   $1" >&2; }
log_step()    { echo -e "\n${BOLD}${BLUE}── $1 ${NC}"; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_DIR="$REPO_ROOT/cf-demo"
PACKAGE_NAME="@waqftech/markdown-editor"

# ── Args ───────────────────────────────────────────────────────────────────────
UPDATE=false
for arg in "$@"; do
  [[ "$arg" == "--update" ]] && UPDATE=true
done

# ══════════════════════════════════════════════════════════════════════════════
# PRE-FLIGHT CHECKS
# ══════════════════════════════════════════════════════════════════════════════
log_step "Pre-flight checks"

# 1. wrangler
if ! command -v wrangler &>/dev/null && ! npx --yes wrangler --version &>/dev/null 2>&1; then
  log_error "wrangler not found. Install with: npm install -g wrangler"
  exit 1
fi
WRANGLER_USER=$(npx wrangler whoami 2>&1 | grep -oP "(?<=email )[\w@.\-]+" || true)
if [[ -z "$WRANGLER_USER" && -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  log_error "Not authenticated with Cloudflare. Run: wrangler login"
  exit 1
fi
[[ -n "$WRANGLER_USER" ]] && log_success "Wrangler authenticated as $WRANGLER_USER" \
                           || log_success "Wrangler authenticated via CLOUDFLARE_API_TOKEN"

# 2. Resolve versions
DECLARED_VERSION=$(node -e "
  const v = require('$DEMO_DIR/package.json').dependencies['$PACKAGE_NAME'];
  console.log(v.replace(/[\^~]/,''));
")
LATEST_ON_NPM=$(npm info "$PACKAGE_NAME" version 2>/dev/null || echo "unknown")

# What's actually installed in node_modules (may differ from declared)
INSTALLED_VERSION="(not installed)"
if [[ -f "$DEMO_DIR/node_modules/$PACKAGE_NAME/package.json" ]]; then
  INSTALLED_VERSION=$(node -e "console.log(require('$DEMO_DIR/node_modules/$PACKAGE_NAME/package.json').version)")
fi

echo ""
echo -e "  ${BOLD}Package versions:${NC}"
echo -e "  declared in package.json : ${YELLOW}$DECLARED_VERSION${NC}"
echo -e "  installed in node_modules: ${YELLOW}$INSTALLED_VERSION${NC}"
echo -e "  latest on npm            : ${GREEN}$LATEST_ON_NPM${NC}"
echo ""

# 3. Warn if declared version isn't on npm yet
if [[ "$LATEST_ON_NPM" != "unknown" ]]; then
  DECLARED_CLEAN="${DECLARED_VERSION//[^0-9.]/}"
  if ! npm info "$PACKAGE_NAME@$DECLARED_CLEAN" version &>/dev/null 2>&1; then
    log_warn "$PACKAGE_NAME@$DECLARED_CLEAN is not published yet."
    log_warn "Run 'npm publish --access public' from the repo root first, then re-run this script."
    exit 1
  fi
fi

# 4. Suggest --update if installed version is behind latest
if [[ "$INSTALLED_VERSION" != "$LATEST_ON_NPM" && "$UPDATE" == false && "$LATEST_ON_NPM" != "unknown" ]]; then
  log_warn "Installed version ($INSTALLED_VERSION) is behind latest ($LATEST_ON_NPM)."
  log_warn "Pass --update to upgrade before deploying, or continue with the current version."
  read -p "$(echo -e "${YELLOW}[PROMPT]${NC} Continue with $INSTALLED_VERSION? (y/N) ")" -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && { log_info "Aborted. Re-run with: ./scripts/deployDemo.sh --update"; exit 0; }
fi

# ══════════════════════════════════════════════════════════════════════════════
# STEPS
# ══════════════════════════════════════════════════════════════════════════════

# Step 1 — optionally upgrade the editor package
log_step "Step 1/4 — Editor package"
if [[ "$UPDATE" == true ]]; then
  log_info "Upgrading $PACKAGE_NAME to @latest..."
  npm install --prefix "$DEMO_DIR" "$PACKAGE_NAME@latest"
  NEW_VER=$(node -e "console.log(require('$DEMO_DIR/node_modules/$PACKAGE_NAME/package.json').version)")
  log_success "Upgraded to $NEW_VER"
else
  log_info "Using $PACKAGE_NAME@$INSTALLED_VERSION (pass --update to upgrade)"
fi

# Step 2 — install all deps
log_step "Step 2/4 — Install dependencies"
npm install --prefix "$DEMO_DIR"
log_success "Dependencies ready."

# Step 3 — build
log_step "Step 3/4 — Build"
npm run build --prefix "$DEMO_DIR"
DEPLOY_VER=$(node -e "console.log(require('$DEMO_DIR/node_modules/$PACKAGE_NAME/package.json').version)")
log_success "Built with $PACKAGE_NAME@$DEPLOY_VER → $DEMO_DIR/dist"

# Step 4 — deploy
log_step "Step 4/4 — Deploy to Cloudflare Pages"
npx wrangler pages deploy "$DEMO_DIR/dist" --project-name=markdown-editor
log_success "🚀 cf-demo deployed with $PACKAGE_NAME@$DEPLOY_VER!"
