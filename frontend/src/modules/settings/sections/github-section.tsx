import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { githubApi } from '@/lib/api/github'
import type { GitHubConnection } from '@/lib/types'
import { Section } from '@/modules/settings/settings/ui'

export function GitHubSection() {
  const [status, setStatus] = useState<GitHubConnection>({ connected: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setStatus(await githubApi.status())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GitHub connection')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const connect = async () => {
    setError(null)
    try {
      const { url } = await githubApi.authUrl()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start GitHub connect')
    }
  }

  const disconnect = async () => {
    setLoading(true)
    setError(null)
    try {
      await githubApi.disconnect()
      setStatus({ connected: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect GitHub')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Section
        title="GitHub"
        description="Connect a GitHub account so you can build projects from an existing codebase."
      >
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              {(status.login ?? 'G').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              {status.connected ? (
                <>
                  <div className="text-sm font-medium">@{status.login}</div>
                  <div className="text-xs text-muted-foreground">
                    {status.scopes?.length
                      ? `Granted scopes: ${status.scopes.join(', ')}`
                      : 'Connected'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium">Not connected</div>
                  <div className="text-xs text-muted-foreground">
                    Connect to pick a repository when creating a project
                  </div>
                </>
              )}
            </div>
          </div>
          {status.connected ? (
            <Button variant="outline" onClick={disconnect} disabled={loading}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={connect} disabled={loading}>
              Connect GitHub
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </Section>
    </div>
  )
}
