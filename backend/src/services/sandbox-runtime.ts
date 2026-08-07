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
export function imageBuildCommands(): string[] {
  const startup = readRuntimeAsset('startup.sh')
  const callback = readRuntimeAsset('mcp-callback.mjs')

  return [
    'RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates curl && rm -rf /var/lib/apt/lists/*',
    'RUN npm install -g opencode-ai',
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
    provider[providerIdFor(input.model)] = {
      options: { apiKey: input.providerApiKey },
    }
  }

  const opencodeJson = JSON.stringify(
    {
      $schema: 'https://opencode.ai/config.json',
      model: input.model,
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

  lines.push('')

  return lines.join('\n')
}

function providerIdFor(model: string): string {
  return model.split('/')[0] ?? 'anthropic'
}

export const runtimeInfo = {
  dir: runtimeDir,
  startupFile: runtimeAssetPath('startup.sh'),
  callbackFile: runtimeAssetPath('mcp-callback.mjs'),
  defaultModel: config.sandbox.opencodeModel,
}
