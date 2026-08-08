#!/usr/bin/env bash
set -euo pipefail

OPENCODE_PORT="${OPENCODE_PORT:-4096}"
export GIT_TERMINAL_PROMPT=0

log() {
  echo "[weldrr-startup] $*"
}

log "Setting up workspace at /workspace"
mkdir -p /workspace
cd /workspace

if [ -n "${WELDRR_GIT_TEMPLATE:-}" ]; then
  log "Cloning git template from ${WELDRR_GIT_TEMPLATE}"
  if git clone --depth 1 --quiet "${WELDRR_GIT_TEMPLATE}" /tmp/weldrr-template; then
    cp -a /tmp/weldrr-template/. /workspace/
    rm -rf /tmp/weldrr-template
  else
    log "WARNING: could not clone template (${WELDRR_GIT_TEMPLATE}) — continuing with an empty repo"
    git init --quiet
  fi
else
  log "No git template provided; initializing empty repo"
  git init --quiet
fi

if [ -n "${WELDRR_BOOTSTRAP_URL:-}" ]; then
  log "Fetching bootstrap script from ${WELDRR_BOOTSTRAP_URL}"
  if curl -fsS --retry 2 --retry-delay 2 "${WELDRR_BOOTSTRAP_URL}" -o /tmp/weldrr-bootstrap.sh; then
    bash /tmp/weldrr-bootstrap.sh || log "WARNING: bootstrap script failed (continuing)"
    rm -f /tmp/weldrr-bootstrap.sh
  else
    log "WARNING: could not fetch bootstrap script (continuing without injected config)"
  fi
fi

if [ ! -f /workspace/opencode.json ]; then
  log "No opencode.json present — writing fallback config"
  cat > /workspace/opencode.json <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "model": "${WELDRR_OPENCODE_MODEL:-opencode/deepseek-v4-flash-free}",
  "mcp": {
    "weldrr-callback": {
      "type": "local",
      "command": ["node", "/opt/weldrr/mcp-callback.mjs"],
      "enabled": true
    }
  },
  "permission": {
    "edit": "allow",
    "bash": "allow",
    "webfetch": "allow",
    "glob": "allow",
    "grep": "allow",
    "list": "allow",
    "read": "allow",
    "task": "allow"
  }
}
EOF
fi

if [ -n "${WELDRR_GIT_REMOTE:-}" ] && [ -n "${WELDRR_GIT_TOKEN:-}" ]; then
  log "Configuring git remote for artifact push"
  git config user.name "Weldrr"
  git config user.email "sdk@weldrr.app"
  # In PR mode the agent works on a weldrr feature branch (reviewed before merge);
  # otherwise push to main as before.
  GIT_BRANCH="${WELDRR_GIT_BRANCH:-main}"
  git checkout -b "${GIT_BRANCH}" 2>/dev/null || git checkout "${GIT_BRANCH}" 2>/dev/null || true
  git remote remove origin 2>/dev/null || true
  # x-access-token is a GitHub-accepted placeholder username for OAuth/PAT tokens.
  git remote add origin "https://x-access-token:${WELDRR_GIT_TOKEN}@${WELDRR_GIT_REMOTE#https://}"
fi

export OPENCODE_SERVER_PASSWORD="${WELDRR_OPENCODE_PASSWORD:-}"
log "Starting opencode web on 0.0.0.0:${OPENCODE_PORT}"
exec opencode web --port "${OPENCODE_PORT}" --hostname 0.0.0.0
