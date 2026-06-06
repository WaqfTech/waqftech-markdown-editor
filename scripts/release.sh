#!/usr/bin/env bash

# Strict error checking and defensive bash patterns
set -euo pipefail
IFS=$'\n\t'

# Color constants for high-signal UI outputs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Pre-flight check: Are we inside a git repo?
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log_error "Not inside a git repository."
  exit 1
fi

# Pre-flight check: Is the working directory clean?
if ! git diff-index --quiet HEAD --; then
  log_warn "Git working directory is not clean. Uncommitted changes exist."
  read -p "Do you want to proceed anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Release aborted by user."
    exit 1
  fi
fi

# Determine package manager (prefer aube, fallback to pnpm)
PKG_MANAGER="pnpm"
if command -v aube >/dev/null 2>&1; then
  PKG_MANAGER="aube"
fi
log_info "Using package manager: $PKG_MANAGER"

# Pre-flight check: Are we authenticated with NPM?
log_info "Verifying NPM authentication status..."
if ! pnpm whoami >/dev/null 2>&1 && ! npm whoami >/dev/null 2>&1; then
  log_error "You are not logged into NPM. Please run 'npm login' or 'pnpm login' first."
  exit 1
fi
CURRENT_USER=$(pnpm whoami 2>/dev/null || npm whoami 2>/dev/null)
log_success "Authenticated as NPM user: $CURRENT_USER"

# Parse arguments for release type (major, minor, patch, or specific version)
RELEASE_TYPE=${1:-patch}
if [[ "$RELEASE_TYPE" != "patch" && "$RELEASE_TYPE" != "minor" && "$RELEASE_TYPE" != "major" && ! "$RELEASE_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  log_error "Invalid argument. Usage: ./scripts/release.sh [patch|minor|major|x.y.z] [--otp 123456]"
  exit 1
fi

# Optional OTP argument for 2FA
OTP_ARG=""
if [[ "${2:-}" == "--otp" && -n "${3:-}" ]]; then
  OTP_ARG="--otp $3"
elif [[ "${3:-}" == "--otp" && -n "${4:-}" ]]; then
  OTP_ARG="--otp $4"
fi

# 1. Build step
log_info "Step 1/5: Building package assets..."
if [[ "$PKG_MANAGER" == "aube" ]]; then
  aube run build
else
  pnpm run build
fi
log_success "Build completed successfully."

# 2. Version Bumping
log_info "Step 2/5: Bumping package version ($RELEASE_TYPE)..."
OLD_VERSION=$(node -e "console.log(require('./package.json').version)")

NEW_VERSION=$(node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json'));
  const parts = pkg.version.split('.').map(Number);
  const type = '$RELEASE_TYPE';
  if (type === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (type === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
  } else if (type === 'patch') {
    parts[2] += 1;
  } else {
    pkg.version = type;
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log(type);
    process.exit(0);
  }
  pkg.version = parts.join('.');
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log(pkg.version);
")

log_success "Version bumped: v$OLD_VERSION -> v$NEW_VERSION"

# 3. Commit and Tag
log_info "Step 3/5: Committing and tagging release..."
git add package.json
# Sync with duplicated copy inside manara.waqf.app if applicable
MANARA_PATH="/mnt/Jad/github/projects/jadmadi/manara.waqf.app/waqftech-markdown-editor"
if [[ -d "$MANARA_PATH" ]]; then
  log_info "Syncing version bump with duplicate copy inside manara.waqf.app..."
  node -e "
    const fs = require('fs');
    const path = '$MANARA_PATH/package.json';
    const pkg = JSON.parse(fs.readFileSync(path));
    pkg.version = '$NEW_VERSION';
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  "
  git -C "/mnt/Jad/github/projects/jadmadi/manara.waqf.app" add waqftech-markdown-editor/package.json || true
fi

# Standard conventional commit format
git commit -m "bump: v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
log_success "Git commit and tag created: v$NEW_VERSION"

# 4. Push to GitHub
log_info "Step 4/5: Pushing code and tags to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"
log_success "Successfully pushed to GitHub."

# 5. Publish to NPM
log_info "Step 5/5: Publishing to NPM..."
# Check for 2FA requirement and print warning if OTP is not provided
if [[ -z "$OTP_ARG" ]]; then
  log_warn "If your account has 2FA enabled, the command might prompt you to authenticate via your physical security key/browser."
fi

# Run the publish command
if [[ -n "$OTP_ARG" ]]; then
  pnpm publish --access public --no-git-checks $OTP_ARG
else
  pnpm publish --access public --no-git-checks
fi

log_success "Successfully published @waqftech/markdown-editor@v$NEW_VERSION to NPM!"

# 6. Optionally deploy cf-demo
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
read -p "$(echo -e "${YELLOW}[PROMPT]${NC} Deploy cf-demo to Cloudflare Pages now? (y/N) ")" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  log_info "Step 6: Deploying cf-demo with the new package version..."
  bash "$SCRIPT_DIR/deployDemo.sh" --update
else
  log_info "Skipping demo deploy. Run later with: ./scripts/deployDemo.sh --update"
fi

log_success "🎉 Release v$NEW_VERSION completed flawlessly!"
