import { useEffect, useState } from 'react'
import { Check, ImagePlus, LoaderCircle, Palette, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { docsApi, type BrandingConfig } from '@/lib/api/docs'
import { cn } from '@/lib/utils'

const FONTS = [
  { id: 'system', label: 'System default' },
  { id: 'geist', label: 'Geist' },
  { id: 'inter', label: 'Inter' },
  { id: 'mono', label: 'Monospace' },
] as const

type FileKind = 'logo' | 'favicon' | 'ogImage'

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function BrandingSection({ projectId }: { projectId: string }) {
  const [config, setConfig] = useState<BrandingConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<Record<FileKind, File | null>>({
    logo: null,
    favicon: null,
    ogImage: null,
  })

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    docsApi
      .readBranding(projectId)
      .then((cfg) => {
        if (mounted) setConfig(cfg)
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load branding')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [projectId])

  const onPickFile = async (kind: FileKind) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = kind === 'favicon' ? '.svg,.png,.ico' : kind === 'ogImage' ? 'image/*' : '.svg,.png,.webp'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setPendingFiles((f) => ({ ...f, [kind]: file }))
      setError(null)
    }
    input.click()
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const assets: { path: string; base64: string }[] = []
      const filePaths: Record<FileKind, string> = {
        logo: 'public/logo.svg',
        favicon: 'public/favicon.svg',
        ogImage: 'public/og.png',
      }
      const next: BrandingConfig = { ...config }

      for (const kind of Object.keys(pendingFiles) as FileKind[]) {
        const file = pendingFiles[kind]
        if (!file) continue
        const base64 = await readAsBase64(file)
        assets.push({ path: filePaths[kind], base64 })
        if (kind === 'logo') next.logo = `/${filePaths[kind].replace('public/', '')}`
        if (kind === 'favicon') next.favicon = `/${filePaths[kind].replace('public/', '')}`
        if (kind === 'ogImage') next.ogImage = `/${filePaths[kind].replace('public/', '')}`
      }

      await docsApi.writeBranding(projectId, next, assets)
      setConfig(next)
      setPendingFiles({ logo: null, favicon: null, ogImage: null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl border border-border bg-muted" />
  }

  return (
    <Card title="Branding">
      <div className="space-y-6 p-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Site name</label>
          <Input
            value={config.siteName ?? ''}
            onChange={(e) => setConfig((c) => ({ ...c, siteName: e.target.value }))}
            placeholder="e.g. PayGrid API"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Type className="size-4" /> Font
          </label>
          <div className="flex flex-wrap gap-2">
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setConfig((c) => ({ ...c, font: f.id }))}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  config.font === f.id || (!config.font && f.id === 'system')
                    ? 'border-brand bg-brand-soft text-foreground'
                    : 'border-border text-muted-foreground hover:border-ring hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Palette className="size-4" /> Colors
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              label="Primary"
              value={config.colors?.primary ?? '#8d54ff'}
              onChange={(v) => setConfig((c) => ({ ...c, colors: { ...c.colors, primary: v } }))}
            />
            <ColorField
              label="Accent"
              value={config.colors?.accent ?? '#8d54ff'}
              onChange={(v) => setConfig((c) => ({ ...c, colors: { ...c.colors, accent: v } }))}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <ImagePlus className="size-4" /> Images
          </label>
          <div className="space-y-3">
            {(
              [
                { kind: 'logo' as FileKind, label: 'Logo', hint: 'SVG or PNG, appears in the header.' },
                { kind: 'favicon' as FileKind, label: 'Favicon', hint: 'SVG, PNG, or ICO.' },
                { kind: 'ogImage' as FileKind, label: 'Social preview', hint: 'Used when your docs are shared.' },
              ] as const
            ).map((item) => {
              const file = pendingFiles[item.kind]
              const existing =
                item.kind === 'logo' ? config.logo : item.kind === 'favicon' ? config.favicon : config.ogImage
              return (
                <div key={item.kind} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {file ? file.name : existing ? `Current: ${existing}` : 'None uploaded'}
                    </div>
                    <div className="text-[11px] text-muted-foreground/70">{item.hint}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => void onPickFile(item.kind)}>
                    {file ? 'Replace' : existing ? 'Change' : 'Upload'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
            Save branding
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="size-3.5" /> Saved — the docs site will redeploy on push.
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
      />
      <div className="min-w-0">
        <label className="block text-xs text-muted-foreground">{label}</label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-0.5 h-8 font-mono text-xs" />
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-background">
      <header className="border-b border-border bg-muted px-5 py-3">
        <h2 className="text-[13px] font-medium text-foreground">{title}</h2>
      </header>
      {children}
    </section>
  )
}
