import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '@/config'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const runtimeDir = path.resolve(currentDir, '../sandbox-runtime')

export type BootstrapInput = {
  model: string
  providerApiKey: string
  jobType: 'discovery' | 'sdk' | 'docs'
  sandboxId: string
  spec?: Record<string, unknown>
  docsMarkdown?: string
  gitTemplate?: string
  /** Markdown describing the generated SDKs, written to sdk.md for the docs agent. */
  sdkContext?: string
  /** npm publish token (writes .npmrc). */
  npmToken?: string
  /** PyPI API token (used as TWINE_PASSWORD). */
  pypiToken?: string
}

export function runtimeAssetPath(rel: string): string {
  return path.join(runtimeDir, rel)
}

export function readRuntimeAsset(rel: string): string {
  return fs.readFileSync(runtimeAssetPath(rel), 'utf8')
}

function base64(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64')
}

/** Dockerfile steps that bake the runtime assets into the sandbox image. */
const OPENCODE_VERSION = '1.18.15'

export function imageBuildCommands(): string[] {
  const startup = readRuntimeAsset('startup.sh')
  const callback = readRuntimeAsset('mcp-callback.mjs')

  return [
    'RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates curl python3 python3-pip python3-venv python-is-python3 && rm -rf /var/lib/apt/lists/*',
    'RUN pip3 install --break-system-packages --no-cache-dir build twine',
    `RUN npm install -g opencode-ai@${OPENCODE_VERSION}`,
    'RUN mkdir -p /opt/weldrr',
    `RUN printf '%s' '${base64(startup)}' | base64 -d > /opt/weldrr/startup.sh && chmod +x /opt/weldrr/startup.sh`,
    `RUN printf '%s' '${base64(callback)}' | base64 -d > /opt/weldrr/mcp-callback.mjs && chmod +x /opt/weldrr/mcp-callback.mjs`,
  ]
}

/**
 * Builds the bash bootstrap script served to a sandbox on startup. It writes
 * the injected agent skills and opencode.json (with the callback MCP tool) into
 * the workspace, then hands off to `opencode web` which the startup script execs.
 */
export function bootstrapScript(input: BootstrapInput): string {
  const skillName =
    input.jobType === 'docs'
      ? 'docs-builder'
      : input.jobType === 'discovery'
        ? 'discovery-agent'
        : 'sdk-builder'
  const skills: { rel: string; content: string }[] = [
    `${skillName}/SKILL.md`,
  ].map((rel) => ({ rel, content: readRuntimeAsset(path.join('skills', rel)) }))

  const provider: Record<string, unknown> = {}
  if (input.providerApiKey) {
    const providerId = providerIdFor(input.model)
    const custom = CUSTOM_PROVIDERS[providerId]
    if (custom) {
      provider[providerId] = {
        name: custom.name,
        npm: custom.npm,
        options: { apiKey: input.providerApiKey, baseURL: custom.baseURL },
        models: custom.models,
      }
    } else {
      provider[providerId] = {
        options: { apiKey: input.providerApiKey },
      }
    }
  }

  const opencodeJson = JSON.stringify(
    {
      $schema: 'https://opencode.ai/config.json',
      model: input.model,
      // Use the same model for opencode's internal "small" tasks (session
      // titles, summarization) so it doesn't try to reach the default OpenCode
      // Zen endpoint, which is unreachable inside the isolated sandbox and can
      // block the agent loop when a tool call completes.
      small_model: input.model,
      ...(Object.keys(provider).length > 0 ? { provider } : {}),
      mcp: {
        'weldrr-callback': {
          type: 'local',
          command: ['node', '/opt/weldrr/mcp-callback.mjs'],
          enabled: true,
        },
      },
      permission: {
        edit: 'allow',
        bash: 'allow',
        webfetch: 'allow',
        glob: 'allow',
        grep: 'allow',
        list: 'allow',
        read: 'allow',
        task: 'allow',
        // The agent legitimately reads ~/.pypirc, ~/.npmrc and writes to
        // /tmp/opencode during builds. Without this, opencode raises an
        // un-answerable `external_directory` prompt (no human in the sandbox)
        // and the agent loop hangs forever.
        external_directory: 'allow',
      },
    },
    null,
    2,
  )

  const lines = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    'cd /workspace',
    `mkdir -p .opencode/skills`,
  ]

  // A shallow template clone breaks pushing to the (empty) target repo:
  // "index-pack failed" / "did not receive expected object". Deepen history
  // against the template repo so the push sends a complete pack.
  if (input.gitTemplate) {
    lines.push(
      'if [ -f .git/shallow ]; then',
      `  log_template_url='${input.gitTemplate}'`,
      `  if git remote add template "${input.gitTemplate}" 2>/dev/null; then`,
      '    git fetch --unshallow template || git fetch --depth=100 template || true',
      '    git remote remove template 2>/dev/null || true',
      '  fi',
      'fi',
    )
  }

  for (const skill of skills) {
    const dir = path.dirname(skill.rel)
    const file = path.basename(skill.rel)
    lines.push(`mkdir -p ".opencode/skills/${dir}"`)
    lines.push(
      `printf '%s' '${base64(skill.content)}' | base64 -d > ".opencode/skills/${dir}/${file}"`,
    )
  }

  lines.push(`printf '%s' '${base64(opencodeJson)}' | base64 -d > opencode.json`)

  if (input.spec) {
    lines.push(
      `printf '%s' '${base64(JSON.stringify(input.spec))}' | base64 -d > spec.json`,
    )
  }

  if (input.docsMarkdown) {
    lines.push(
      `printf '%s' '${base64(input.docsMarkdown)}' | base64 -d > docs.md`,
    )
  }

  if (input.sdkContext) {
    lines.push(
      `printf '%s' '${base64(input.sdkContext)}' | base64 -d > sdk.md`,
    )
  }

  // npm publish auth — write .npmrc at the package root so `npm publish` can
  // push without interactive login.
  if (input.npmToken) {
    lines.push(
      `printf '%s' '${base64(`//registry.npmjs.org/:_authToken=${input.npmToken}\n`)}' | base64 -d > .npmrc`,
    )
  }

  // PyPI publish auth — write ~/.pypirc so `twine upload` (and `python -m
  // twine upload`) authenticate with the API token (username is `__token__`).
  // Written as a file rather than exported env vars because the bootstrap runs
  // in a child shell whose exports do not survive into the agent process.
  if (input.pypiToken) {
    const pypirc = `[distutils]\nindex-servers =\n    pypi\n\n[pypi]\nusername = __token__\npassword = ${input.pypiToken}\n`
    lines.push(
      `printf '%s' '${base64(pypirc)}' | base64 -d > ~/.pypirc`,
      `chmod 600 ~/.pypirc`,
    )
  }

  lines.push('')

  return lines.join('\n')
}

function providerIdFor(model: string): string {
  return model.split('/')[0] ?? 'anthropic'
}

/**
 * Custom, OpenAI-compatible providers that opencode doesn't know about out of
 * the box. Configured so the sandbox's opencode.json can talk to them via the
 * AI SDK's openai-compatible driver. Keyed by provider id (the part of the
 * model id before the first '/').
 */
const CUSTOM_PROVIDERS: Record<
  string,
  {
    name: string
    npm: string
    baseURL: string
    models: Record<string, { name?: string; id?: string }>
  }
> = {
  'cline-pass': {
    name: 'Cline Pass',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://api.cline.bot/api/v1',
    models: {
      'deepseek-v4-flash': {
        name: 'deepseek-v4-flash',
        id: 'cline-pass/deepseek-v4-flash',
      },
    },
  },
  'opencode-go': {
    name: 'OpenCode Go',
    npm: '@ai-sdk/openai-compatible',
    baseURL: 'https://opencode.ai/zen/go/v1',
    models: {
      'deepseek-v4-flash': { name: 'DeepSeek V4 Flash' },
    },
  },
}

export const runtimeInfo = {
  dir: runtimeDir,
  startupFile: runtimeAssetPath('startup.sh'),
  callbackFile: runtimeAssetPath('mcp-callback.mjs'),
  defaultModel: config.sandbox.opencodeModel,
}
