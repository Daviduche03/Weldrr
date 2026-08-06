import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/modules/auth/auth-provider'

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .3.21.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.86 11.86 0 0 0 0 12c0 1.94.47 3.77 1.29 5.38l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

const highlights = [
  'Generate docs, SDKs, and a CLI from your API spec',
  'One source of truth, always in sync',
  'AI chat built into your documentation',
]

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSignIn = (provider: 'github' | 'google') => {
    signIn(provider)
    navigate('/dashboard')
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

            <div className="mt-10 flex flex-col gap-3">
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => handleSignIn('github')}
              >
                <GithubIcon className="size-4" />
                Continue with GitHub
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => handleSignIn('google')}
              >
                <GoogleIcon className="size-4" />
                Continue with Google
              </Button>
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
              .
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
