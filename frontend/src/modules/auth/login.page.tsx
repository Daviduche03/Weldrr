import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight01Icon } from 'hugeicons-react'
import { LoaderCircle } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/modules/auth/auth-provider'
import { cn } from '@/lib/utils'

const highlights = [
  'Generate docs, SDKs, and a CLI from your API spec',
  'One source of truth, always in sync',
  'AI chat built into your documentation',
]

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<'developer' | 'team'>('team')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'signin') {
        await login(email.trim(), password)
      } else {
        await register({
          name: name.trim() || 'New user',
          email: email.trim(),
          password,
          accountType,
        })
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  return (
    <div className="relative min-h-screen">
      <header className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link to="/">
          <Logo />
        </Link>
      </header>

      <main
        className="flex min-h-[calc(100vh-4rem)]"
        style={{
          marginLeft: 'max(2rem, calc((100vw - 80rem) / 2 - 2rem))',
          marginRight: 'max(2rem, calc((100vw - 80rem) / 2 - 2rem))',
        }}
      >
        <div className="grid w-full grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-2">
          <div
            className="flex flex-col justify-between bg-background p-10 sm:p-14"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          >
            <div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything your developers need, generated from one source of truth
              </h2>
              <ul className="mt-10 space-y-4">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brand"
                    >
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 flex items-center gap-3 border-t border-border pt-6">
              <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
                  <path
                    d="M4.5 19 L8.5 5 L11.5 13 L14.5 5 L18.5 19"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <div className="text-sm font-semibold tracking-tight">Trusted by teams</div>
                <div className="text-xs text-muted-foreground">
                  Shipping AI-native developer experiences
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-background p-10 sm:p-14">
            <h1 className="text-balance text-3xl font-semibold tracking-tight">
              Welcome to Weldrr
            </h1>
            <p className="mt-3 text-pretty text-muted-foreground">
              Sign in to generate docs, SDKs, and a CLI for your API.
            </p>

            <div className="mt-8 flex gap-1 rounded-lg bg-muted p-1">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    mode === m
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoFocus={mode === 'signin'}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  required
                  minLength={mode === 'signup' ? 8 : 1}
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Account type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: 'team', label: 'Team', hint: 'For organizations' },
                        { value: 'developer', label: 'Developer', hint: 'Just me' },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAccountType(option.value)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-left transition-colors',
                          accountType === option.value
                            ? 'border-brand bg-brand-soft'
                            : 'border-border bg-background hover:bg-muted',
                        )}
                      >
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              Demo workspace — use{' '}
              <span className="font-mono text-foreground">admin@weldrr.app</span> /{' '}
              <span className="font-mono text-foreground">admin123</span>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing, you agree to our{' '}
              <a
                href="#"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="#"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Privacy Policy
              </a>
              . <ArrowRight01Icon className="inline size-3" aria-hidden="true" />
            </p>
          </div>
        </div>
      </main>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 left-[max(1rem,calc((100vw-80rem)/2-2rem))] z-50 w-px border-l border-border"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 right-[max(1rem,calc((100vw-80rem)/2-2rem))] z-50 w-px border-r border-border"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 left-[max(2rem,calc((100vw-80rem)/2-5rem))] z-50 w-px border-l border-border/70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-y-0 right-[max(2rem,calc((100vw-80rem)/2-5rem))] z-50 w-px border-r border-border/70"
      />
    </div>
  )
}
