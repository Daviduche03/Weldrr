import { Copy, KeyRound, Plus, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ApiKey } from '@/lib/types'

export function ApiKeysSection({
  keys,
  newKey,
  keyName,
  setKeyName,
  onCreate,
  onRevoke,
  onCopy,
}: {
  keys: ApiKey[]
  newKey: (ApiKey & { secret: string }) | null
  keyName: string
  setKeyName: (value: string) => void
  onCreate: () => void
  onRevoke: (id: string) => void
  onCopy: (text: string) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-background">
      <div
        className="border-b border-border bg-muted px-6 py-3"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        <h2 className="text-sm font-medium text-muted-foreground">API keys</h2>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          Keys for authenticating with the Weldrr API and CI.
        </p>
      </div>

      {newKey && (
        <div className="mx-6 mt-5 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Key created — copy it now</div>
              <div className="mt-1 break-all font-mono text-sm">{newKey.secret}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onCopy(newKey.secret)} aria-label="Copy key">
              <Copy />
              Copy
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            For security, you won&apos;t be able to see this key again.
          </p>
        </div>
      )}

      {keys.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="size-6" />}
          title="No API keys"
          description="Create a key to authenticate with the Weldrr API from CI."
          className="py-12"
        />
      ) : (
        <ul className="divide-y divide-border">
          {keys.map((key) => (
            <li key={key.id} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                  <KeyRound className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{key.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {key.prefix}•••••••••••
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              <div>{key.lastUsedAt ? `Used ${new Date(key.lastUsedAt).toLocaleDateString()}` : 'Never used'}</div>
              <div className="mt-0.5">Created {new Date(key.createdAt).toLocaleDateString()}</div>
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Revoke ${key.name}`}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRevoke(key.id)}
            >
              <Trash2 />
            </Button>
          </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-4">
        <Input
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
          placeholder="Name this key, e.g. CI pipeline"
          className="max-w-xs"
        />
        <Button size="sm" onClick={onCreate}>
          <Plus />
          Create key
        </Button>
      </div>
    </section>
  )
}
