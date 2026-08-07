#!/usr/bin/env node
/**
 * Weldrr callback MCP server.
 *
 * A minimal stdio MCP server (JSON-RPC 2.0 over newline-delimited stdin/stdout)
 * injected into the agent sandbox at startup. Exposes a single tool that the
 * opencode agent calls once it has finished building the SDK or docs, which
 * POSTs back to the Weldrr API so we can transition the job out of "building".
 *
 * Uses only Node built-ins — intentionally dependency-free so it can be written
 * to disk verbatim by the startup script.
 */

import { createInterface } from 'node:readline'
import process from 'node:process'

const CALLBACK_URL = process.env.WELDRR_CALLBACK_URL
const CALLBACK_TOKEN = process.env.WELDRR_CALLBACK_TOKEN ?? ''
const SANDBOX_ID = process.env.WELDRR_SANDBOX_ID ?? ''

const PROTOCOL_VERSION = '2024-11-05'

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`)
}

async function reportSdkComplete(args) {
  const status = args.status === 'failed' ? 'failed' : 'finished'
  const body = {
    sandboxId: SANDBOX_ID,
    token: CALLBACK_TOKEN,
    status,
    artifactUrl: typeof args.artifactUrl === 'string' ? args.artifactUrl : undefined,
    summary: typeof args.summary === 'string' ? args.summary : undefined,
  }

  if (!CALLBACK_URL) {
    return { ok: false, error: 'WELDRR_CALLBACK_URL is not configured in this sandbox' }
  }

  const res = await fetch(CALLBACK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    return { ok: false, error: `Weldrr callback returned HTTP ${res.status}` }
  }

  const payload = await res.json().catch(() => null)
  return {
    ok: true,
    ...(payload && typeof payload === 'object' ? payload : {}),
  }
}

const tools = [
  {
    name: 'report_sdk_complete',
    description:
      'Call this when the SDK (or documentation) build is finished or has failed. ' +
      'Provide the artifact URL (e.g. a git remote or archive URL) when available.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['finished', 'failed'],
          description: 'Whether the build succeeded or failed.',
        },
        artifactUrl: {
          type: 'string',
          description: 'Public URL of the built artifact (optional).',
        },
        summary: {
          type: 'string',
          description: 'Short summary of what was built (optional).',
        },
      },
      required: ['status'],
    },
  },
]

async function handleCall(name, args = {}) {
  if (name === 'report_sdk_complete') {
    const result = await reportSdkComplete(args)
    const text = result.ok
      ? `Reported build as ${args.status} to Weldrr.`
      : `Failed to report to Weldrr: ${result.error ?? 'unknown error'}`
    return {
      content: [{ type: 'text', text }],
      isError: !result.ok,
      ...(result.ok ? { structuredContent: { ok: true, sandboxId: SANDBOX_ID } } : {}),
    }
  }
  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  }
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })

rl.on('line', async (line) => {
  if (!line.trim()) return

  let msg
  try {
    msg = JSON.parse(line)
  } catch {
    return
  }

  if (msg.method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'weldrr-callback', version: '1.0.0' },
      },
    })
    return
  }

  if (msg.method === 'ping') {
    send({ jsonrpc: '2.0', id: msg.id, result: {} })
    return
  }

  if (msg.method === 'tools/list') {
    send({ jsonrpc: '2.0', id: msg.id, result: { tools } })
    return
  }

  if (msg.method === 'tools/call') {
    const { name = '', arguments: args = {} } = msg.params ?? {}
    const result = await handleCall(name, args)
    send({ jsonrpc: '2.0', id: msg.id, result })
    return
  }

  // Notifications carry no id — acknowledge by doing nothing.
  if (msg.id !== undefined && msg.method !== undefined) {
    send({
      jsonrpc: '2.0',
      id: msg.id,
      error: { code: -32601, message: `Method not found: ${msg.method}` },
    })
  }
})
