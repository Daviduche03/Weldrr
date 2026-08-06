import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { SpecType } from '@/lib/types'
import { cn } from '@/lib/utils'

const specTypes: { value: SpecType; label: string; hint: string }[] = [
  { value: 'openapi', label: 'OpenAPI', hint: 'REST APIs' },
  { value: 'graphql', label: 'GraphQL', hint: 'Schemas' },
  { value: 'grpc', label: 'gRPC', hint: 'Protobuf' },
  { value: 'asyncapi', label: 'AsyncAPI', hint: 'Events' },
]

const sources = [
  { value: 'paste', label: 'Paste a spec', hint: 'Copy your spec in' },
  { value: 'url', label: 'From a URL', hint: 'Fetch remotely' },
  { value: 'upload', label: 'Upload a file', hint: 'JSON or YAML' },
] as const

const steps = ['Project', 'Spec', 'Generate'] as const


export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [specType, setSpecType] = useState<SpecType>('openapi')
  const [source, setSource] = useState<'paste' | 'url' | 'upload'>('paste')
  const [specText, setSpecText] = useState('')
  const [generating, setGenerating] = useState(false)

  const canContinue =
    step === 0 ? name.trim().length > 0 : step === 1 ? specText.trim().length > 0 : true

  const handleGenerate = async () => {
    setGenerating(true)
    await api.createProject({ name, specType, specSource: source })
    setGenerating(false)
    setStep(3)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                i <= step ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {i + 1}
            </span>
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              {label}
            </span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Name your project</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give your API a name. You can change it later.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Project name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Voice Agents API"
                  autoFocus
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Spec type</label>
                <div className="grid grid-cols-2 gap-2">
                  {specTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSpecType(t.value)}
                      className={cn(
                        'rounded-lg border px-4 py-3 text-left transition-colors',
                        specType === t.value
                          ? 'border-brand bg-brand-soft'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Add your spec</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  How do you want to provide your {specTypes.find((s) => s.value === specType)?.label} spec?
                </p>
              </div>
              <div>
                <div className="grid grid-cols-3 gap-2">
                  {sources.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSource(s.value)}
                      className={cn(
                        'rounded-lg border px-3 py-3 text-left transition-colors',
                        source === s.value
                          ? 'border-brand bg-brand-soft'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{s.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  {source === 'paste'
                    ? 'Paste your spec'
                    : source === 'url'
                      ? 'Spec URL'
                      : 'File contents'}
                </label>
                {source === 'paste' ? (
                  <textarea
                    value={specText}
                    onChange={(e) => setSpecText(e.target.value)}
                    placeholder={'openapi: 3.1.0\ninfo:\n  title: My API\n  version: 1.0.0\npaths: {}'}
                    rows={10}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                  />
                ) : (
                  <input
                    value={specText}
                    onChange={(e) => setSpecText(e.target.value)}
                    placeholder={
                      source === 'url'
                        ? 'https://api.example.com/openapi.json'
                        : 'Paste or drag a file…'
                    }
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                  />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Ready to generate</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We&apos;ll create everything below from your spec.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-6">
                <div className="text-sm font-semibold tracking-tight">{name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {specType.toUpperCase()} ·{' '}
                  {source === 'paste' ? 'Pasted spec' : source === 'url' ? 'Spec URL' : 'Uploaded file'}
                </div>
                <ul className="mt-5 space-y-3">
                  {[
                    'Documentation website',
                    'SDKs in 12 languages',
                    'Command-line interface',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        className="size-4 text-brand"
                      >
                        <path
                          d="M3.5 8.5l3 3 6-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden="true">
                  <path
                    d="M5 13l4 4 10-11"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h1 className="mt-6 text-2xl font-semibold tracking-tight">
                {name} is generating
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                We&apos;re building your docs, SDKs, and CLI. This usually takes about a minute.
              </p>
              <Button size="lg" className="mt-8" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            </div>
          )}

          {step < 3 && (
            <div className="mt-10 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                Back
              </Button>
              {step < 2 ? (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                  Continue
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Generating…' : 'Generate'}
                </Button>
              )}
            </div>
          )}
      </div>
  )
}
