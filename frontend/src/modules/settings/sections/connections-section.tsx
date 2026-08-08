import { useState } from 'react'
import { LoaderCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BrandIcon } from '@/components/brand-icon'
import { connectionApi, type ConnectionProvider } from '@/lib/api/connections'
import { useConnections, useSaveToken, useDisconnect } from '@/lib/queries'
import { Section } from '@/modules/settings/settings/ui'
import { cn } from '@/lib/utils'

type ProviderMeta = {
  provider: ConnectionProvider
  label: string
  desc: string
  icon: React.ReactNode
  tokenLabel?: string
  tokenPlaceholder?: string
}

const providerMeta: ProviderMeta[] = [
  {
    provider: 'github',
    label: 'GitHub',
    desc: 'Build projects from an existing codebase and push generated docs/SDKs.',
    icon: <BrandIcon name="github" />,
  },
  {
    provider: 'npm',
    label: 'npm',
    desc: 'Publish TypeScript SDKs to the npm registry.',
    icon: <BrandIcon name="npm" />,
    tokenLabel: 'npm access token',
    tokenPlaceholder: 'npm_...',
  },
  {
    provider: 'pypi',
    label: 'PyPI',
    desc: 'Publish Python SDKs to PyPI.',
    icon: <BrandIcon name="pypi" />,
    tokenLabel: 'PyPI API token',
    tokenPlaceholder: 'pypi-...',
  },
  {
    provider: 'goproxy',
    label: 'Go proxy',
    desc: 'Publish Go SDKs to your module proxy.',
    icon: <BrandIcon name="go" />,
    tokenLabel: 'Proxy token',
    tokenPlaceholder: '••••••••••••',
  },
  {
    provider: 'maven',
    label: 'Maven Central',
    desc: 'Publish Java/Kotlin SDKs to Maven Central.',
    icon: <BrandIcon name="maven" />,
    tokenLabel: 'Central token',
    tokenPlaceholder: '••••••••••••',
  },
  {
    provider: 'rubygems',
    label: 'RubyGems',
    desc: 'Publish Ruby SDKs to RubyGems.',
    icon: <BrandIcon name="rubygems" />,
    tokenLabel: 'RubyGems API key',
    tokenPlaceholder: 'rubygems_...',
  },
]

export function ConnectionsSection() {
  const connectionsQuery = useConnections()
  const saveTokenMutation = useSaveToken()
  const disconnectMutation = useDisconnect()
  const connections = connectionsQuery.data ?? []
  const loading = connectionsQuery.isLoading
  const [error, setError] = useState<string | null>(
    connectionsQuery.error instanceof Error ? connectionsQuery.error.message : null,
  )

  const [tokenDraft, setTokenDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const connectedFor = (provider: ConnectionProvider) =>
    connections.find((c) => c.provider === provider)?.connected ?? false

  const connectGithub = async () => {
    setBusy('github')
    setError(null)
    try {
      const { url } = await connectionApi.githubAuthUrl()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start GitHub connect')
      setBusy(null)
    }
  }

  const saveToken = async (provider: ConnectionProvider) => {
    const token = (tokenDraft[provider] ?? '').trim()
    if (!token) return
    setSaving(provider)
    setError(null)
    try {
      await saveTokenMutation.mutateAsync({ provider: provider as never, token })
      setTokenDraft((d) => ({ ...d, [provider]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save token')
    } finally {
      setSaving(null)
    }
  }

  const disconnect = async (provider: ConnectionProvider) => {
    setBusy(provider)
    setError(null)
    try {
      await disconnectMutation.mutateAsync(provider as never)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Section
        title="Connections"
        description="Credentials the generation pipeline uses to publish artifacts on behalf of your workspace. Tokens are encrypted at rest."
      >
        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        <div className="divide-y divide-border">
          {providerMeta.map((meta) => {
            const connected = connectedFor(meta.provider)
            const info = connections.find((c) => c.provider === meta.provider)
            return (
              <div key={meta.provider} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex size-9 shrink-0 items-center justify-center rounded-full border',
                      connected ? 'border-border bg-muted text-foreground' : 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {meta.label}
                      {connected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="size-2.5" /> Connected
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{meta.desc}</div>
                    {connected && info?.accountLogin && (
                      <div className="mt-0.5 text-xs text-muted-foreground/80">
                        @{info.accountLogin}
                      </div>
                    )}
                  </div>
                </div>

                {meta.provider === 'github' ? (
                  connected ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void disconnect('github')}
                      disabled={busy === 'github'}
                    >
                      {busy === 'github' && <LoaderCircle className="size-3.5 animate-spin" />}
                      Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => void connectGithub()} disabled={busy === 'github'}>
                      {busy === 'github' && <LoaderCircle className="size-3.5 animate-spin" />}
                      Connect GitHub
                    </Button>
                  )
                ) : connected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void disconnect(meta.provider)}
                    disabled={busy === meta.provider}
                  >
                    {busy === meta.provider && <LoaderCircle className="size-3.5 animate-spin" />}
                    Disconnect
                  </Button>
                ) : (
                  <div className="flex w-full items-center gap-2 sm:w-auto sm:min-w-72">
                    <Input
                      type="password"
                      value={tokenDraft[meta.provider] ?? ''}
                      onChange={(e) =>
                        setTokenDraft((d) => ({ ...d, [meta.provider]: e.target.value }))
                      }
                      placeholder={meta.tokenPlaceholder}
                      aria-label={meta.tokenLabel}
                    />
                    <Button
                      size="sm"
                      onClick={() => void saveToken(meta.provider)}
                      disabled={saving === meta.provider || !(tokenDraft[meta.provider] ?? '').trim()}
                    >
                      {saving === meta.provider && <LoaderCircle className="size-3.5 animate-spin" />}
                      Save
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
