#!/usr/bin/env bash
set -euo pipefail

# Named volumes can initially be owned by root. Match the devcontainer user's UID.
sudo chown -R "$(id -u):$(id -g)" \
  node_modules \
  "$HOME/.config/opencode" \
  "$HOME/.local/share/opencode" \
  "$HOME/.local/state/opencode"

# The repository's postinstall downloads its matching Chromium into node_modules.
npm ci

# Install Linux libraries required by that exact Playwright version (also for Karma).
npx --no-install playwright install-deps chromium
