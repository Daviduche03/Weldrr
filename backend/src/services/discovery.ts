import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { parse as parseYaml } from 'yaml'
import { config } from '@/config'
import { discoveryRepository } from '@/modules/discoveries/discovery.repository'
import { projectRepository } from '@/modules/projects/projects.repository'
import { versionRepository } from '@/modules/versions/versions.repository'
import { nextVersion } from '@/services/versioning'
import { assertPublicHttpUrl } from '@/shared/utils/url-safety'
import type { Project } from '@/db/schema'
import type { DiscoveryEndpoint } from '@/db/schema'
import { logger } from '@/utils/logger'

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const

export function parseSpec(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as Record<string, unknown>
    } catch {
      return null
    }
  }

  try {
    const parsed = parseYaml(trimmed) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch {
    // fall through
  }
  return null
}

function schemaName(ref: unknown, components: Record<string, unknown>): string | null {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null
  const parts = ref.replace(/^#\//, '').split('/')
  return parts[parts.length - 1] ?? null
}

function describeContent(
  content: unknown,
  components: Record<string, unknown>,
): string | null {
  if (!content || typeof content !== 'object') return null
  const mediaType = (content as Record<string, unknown>)['application/json']
  if (!mediaType || typeof mediaType !== 'object') return null
  const schema = (mediaType as Record<string, unknown>).schema
  if (!schema || typeof schema !== 'object') return null

  const s = schema as Record<string, unknown>
  if (s.$ref) return schemaName(s.$ref as string, components)
  if (s.type === 'array' && s.items && typeof s.items === 'object') {
    const items = s.items as Record<string, unknown>
    if (items.$ref) {
      return `array<${schemaName(items.$ref as string, components)}>`
    }
  }
  return 'inline object'
}

function extractOpenApi(spec: Record<string, unknown>): DiscoveryEndpoint[] {
  const components = (spec.components as Record<string, unknown>) ?? {}
  const paths = (spec.paths as Record<string, Record<string, unknown>>) ?? {}
  const security = (spec.security as { [key: string]: string[] }[]) ?? []
  const globalAuth = security.length > 0 ? security.map((s) => Object.keys(s).join(',')).join(' | ') : null

  const endpoints: DiscoveryEndpoint[] = []
  for (const [path, item] of Object.entries(paths)) {
    if (!item || typeof item !== 'object') continue
    for (const method of HTTP_METHODS) {
      const op = item[method]
      if (!op || typeof op !== 'object') continue
      const o = op as Record<string, unknown>

      const requestBody = o.requestBody
        ? describeContent(
            (o.requestBody as Record<string, unknown>).content,
            components,
          )
        : null

      const responses: DiscoveryEndpoint['responses'] = []
      const resp = (o.responses as Record<string, unknown>) ?? {}
      for (const [status, r] of Object.entries(resp)) {
        if (!r || typeof r !== 'object') continue
        responses.push({
          status,
          schema: describeContent(
            (r as Record<string, unknown>).content,
            components,
          ),
        })
      }

      const opSecurity = (o.security as { [key: string]: string[] }[]) ?? undefined
      const auth = opSecurity
        ? opSecurity.length > 0
          ? opSecurity.map((s) => Object.keys(s).join(',')).join(' | ')
          : null
        : globalAuth

      endpoints.push({
        method: method.toUpperCase(),
        path,
        summary: typeof o.summary === 'string' ? o.summary : null,
        operationId: typeof o.operationId === 'string' ? o.operationId : null,
        requestBody,
        responses,
        auth,
      })
    }
  }
  return endpoints
}

function extractAsyncApi(spec: Record<string, unknown>): DiscoveryEndpoint[] {
  const channels = (spec.channels as Record<string, Record<string, unknown>>) ?? {}
  const endpoints: DiscoveryEndpoint[] = []
  for (const [path, channel] of Object.entries(channels)) {
    if (!channel || typeof channel !== 'object') continue
    for (const action of ['publish', 'subscribe'] as const) {
      const op = channel[action] as { summary?: unknown; operationId?: unknown } | undefined
      if (!op) continue
      endpoints.push({
        method: action.toUpperCase(),
        path,
        summary: typeof op.summary === 'string' ? op.summary : null,
        operationId: typeof op.operationId === 'string' ? op.operationId : null,
        requestBody: null,
        responses: [],
        auth: null,
      })
    }
  }
  return endpoints
}

export function extractEndpoints(
  specType: string,
  spec: Record<string, unknown>,
): DiscoveryEndpoint[] {
  if (specType === 'openapi') return extractOpenApi(spec)
  if (specType === 'asyncapi') return extractAsyncApi(spec)
  return []
}

export function renderDocsMarkdown(input: {
  projectName: string
  specType: string
  endpoints: DiscoveryEndpoint[]
  narrative: string | null
}): string {
  const lines: string[] = []
  lines.push(`# ${input.projectName} — API Reference`)
  lines.push('')
  lines.push(`> Spec type: ${input.specType}. Generated by Weldrr discovery.`)
  lines.push('')

  if (input.narrative) {
    lines.push('## Overview')
    lines.push('')
    lines.push(input.narrative)
    lines.push('')
  }

  lines.push(`## Endpoints (${input.endpoints.length})`)
  lines.push('')

  if (input.endpoints.length === 0) {
    lines.push(
      '_No structured endpoints could be extracted deterministically — rely on the overview and the raw spec._',
    )
    lines.push('')
  }

  for (const ep of input.endpoints) {
    lines.push(`### \`${ep.method} ${ep.path}\``)
    lines.push('')
    if (ep.summary) {
      lines.push(`**Summary:** ${ep.summary}`)
      lines.push('')
    }
    if (ep.operationId) {
      lines.push(`**Operation ID:** \`${ep.operationId}\``)
      lines.push('')
    }
    if (ep.requestBody) {
      lines.push(`**Request body:** \`${ep.requestBody}\``)
      lines.push('')
    }
    if (ep.responses.length > 0) {
      lines.push('**Responses:**')
      lines.push('')
      lines.push('| Status | Body |')
      lines.push('| --- | --- |')
      for (const r of ep.responses) {
        lines.push(`| ${r.status} | \`${r.schema ?? '—'}\` |`)
      }
      lines.push('')
    }
    if (ep.auth) {
      lines.push(`**Auth:** \`${ep.auth}\``)
      lines.push('')
    }
  }

  return lines.join('\n')
}

async function generateNarrative(input: {
  projectName: string
  specType: string
  endpoints: DiscoveryEndpoint[]
  rawSnippet: string
}): Promise<string | null> {
  if (!config.ai.openaiApiKey) {
    logger.info('No OPENAI_API_KEY configured — skipping discovery narrative')
    return null
  }

  const endpointList = input.endpoints
    .map(
      (e) =>
        `- ${e.method} ${e.path}${e.summary ? ` — ${e.summary}` : ''}${e.requestBody ? ` (body: ${e.requestBody})` : ''}${e.responses.length ? ` (${e.responses.map((r) => `${r.status}:${r.schema ?? '?'}`).join(', ')})` : ''}`,
    )
    .join('\n')

  const prompt = `You are the discovery engine for Weldrr, which turns API specs into a concise docs.md that a coding agent will use to build SDKs and docs.

Project: ${input.projectName}
Spec type: ${input.specType}

Endpoints detected:
${endpointList || '(none deterministically detected)'}

Raw spec preview:
${input.rawSnippet.slice(0, 4000)}

Write a "## Overview" section in Markdown that:
1. Summarizes what this API does in 2-3 sentences.
2. Notes any coverage gaps (e.g. missing schemas, undocumented auth, ambiguous request/response shapes) that a build agent should watch out for.
3. Is factual and grounded in the spec — do NOT invent endpoints, fields, or behaviors not present.

Return only the Markdown section.`

  const { text } = await generateText({
    model: openai(config.ai.model),
    prompt,
  })
  return text.trim()
}

export async function runDiscovery(projectId: string): Promise<void> {
  const project = await projectRepository.findByIdGlobal(projectId)
  if (!project) return

  const discovery = await discoveryRepository.create({
    projectId: project.id,
    workspaceId: project.workspaceId,
    status: 'running',
  })

  try {
    const spec = await resolveSpec(project)
    if (!spec) {
      throw new Error('No spec content available for discovery')
    }

    const endpoints = extractEndpoints(project.specType, spec)

    const narrative = await generateNarrative({
      projectName: project.name,
      specType: project.specType,
      endpoints,
      rawSnippet: project.specRaw ?? JSON.stringify(spec).slice(0, 4000),
    })

    const docsMarkdown = renderDocsMarkdown({
      projectName: project.name,
      specType: project.specType,
      endpoints,
      narrative,
    })

    await discoveryRepository.update(discovery.id, {
      status: 'ready',
      docsMarkdown,
      endpoints,
      narrative,
    })
    await recordDocsVersion({
      workspaceId: project.workspaceId,
      projectId: project.id,
      discoveryId: discovery.id,
    })
    logger.info({ projectId, endpoints: endpoints.length }, 'Discovery complete')
  } catch (err) {
    logger.error({ err, projectId }, 'Discovery failed')
    await discoveryRepository.update(discovery.id, {
      status: 'failed',
      error: err instanceof Error ? err.message : 'Discovery failed',
    })
  }
}

async function resolveSpec(project: Project): Promise<Record<string, unknown> | null> {
  if (project.specRaw) {
    const parsed = parseSpec(project.specRaw)
    if (parsed) return parsed
  }
  if (project.spec) return project.spec
  if (project.specUrl) {
    try {
      const url = await assertPublicHttpUrl(project.specUrl)
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) return null
      const raw = await res.text()
      return parseSpec(raw)
    } catch {
      return null
    }
  }
  return null
}

export const discoveryService = {
  run: runDiscovery,
  extract: extractEndpoints,
  render: renderDocsMarkdown,
  parse: parseSpec,
}

/** Records a new docs revision in the version ledger and bumps the project's docsVersion. */
export async function recordDocsVersion(input: {
  workspaceId: string
  projectId: string
  discoveryId: string
}): Promise<void> {
  const latest = await versionRepository.latestForProject(input.projectId, 'docs')
  const version = nextVersion(latest?.version, 'patch')

  await discoveryRepository.update(input.discoveryId, { version })
  await versionRepository.create({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    artifactType: 'docs',
    version,
    discoveryId: input.discoveryId,
  })
  await projectRepository.updateGlobal(input.projectId, { docsVersion: version })
  logger.info({ projectId: input.projectId, version }, 'Docs version recorded')
}
