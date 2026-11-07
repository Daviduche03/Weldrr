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
  CLONE_URL="${WELDRR_GIT_TEMPLATE}"
  if [ -n "${WELDRR_GIT_TEMPLATE_TOKEN:-}" ]; then
    CLONE_URL="https://x-access-token:${WELDRR_GIT_TEMPLATE_TOKEN}@${WELDRR_GIT_TEMPLATE#https://}"
  fi
  # Full clone (not --depth 1): a shallow history breaks pushing to the target
  # repo ("index-pack failed" / "did not receive expected object").
  if git clone --quiet "${CLONE_URL}" /tmp/weldrr-template; then
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
    "task": "allow",
    "external_directory": "allow"
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
  git remote remove origin 2>/dev/null || true
  # x-access-token is a GitHub-accepted placeholder username for OAuth/PAT tokens.
  git remote add origin "https://x-access-token:${WELDRR_GIT_TOKEN}@${WELDRR_GIT_REMOTE#https://}"
  # Fetch the artifact repo so update runs continue on the existing branch
  # instead of a new local branch with unrelated history (whose push would be
  # rejected, stranding the agent's work on a stray branch).
  git fetch origin --quiet 2>/dev/null || true
  if git show-ref --verify --quiet "refs/remotes/origin/${GIT_BRANCH}"; then
    git checkout -B "${GIT_BRANCH}" "origin/${GIT_BRANCH}"
  elif [ "${GIT_BRANCH}" = "main" ] || [ "${GIT_BRANCH}" = "master" ]; then
    git checkout -b "${GIT_BRANCH}" 2>/dev/null || git checkout "${GIT_BRANCH}" 2>/dev/null || true
  else
    # New PR branch: base it on the artifact repo's default branch when there
    # is one, so the branch shares history with the repo it will merge into.
    BASE="$(git symbolic-ref --quiet refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || true)"
    if [ -n "${BASE}" ] && git show-ref --verify --quiet "refs/remotes/origin/${BASE}"; then
      git checkout -b "${GIT_BRANCH}" "origin/${BASE}"
    else
      git checkout -b "${GIT_BRANCH}" 2>/dev/null || git checkout "${GIT_BRANCH}" 2>/dev/null || true
    fi
  fi
fi

export OPENCODE_SERVER_PASSWORD="${WELDRR_OPENCODE_PASSWORD:-}"
log "Starting opencode web on 0.0.0.0:${OPENCODE_PORT}"
exec opencode web --port "${OPENCODE_PORT}" --hostname 0.0.0.0
