import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Hero } from './components/sections/hero'
import { LogoStrip } from './components/sections/logo-strip'
import { Benefits } from './components/sections/benefits'
import { HowItWorks } from './components/sections/how-it-works'
import { Integrations } from './components/sections/integrations'
import { Pricing } from './components/sections/pricing'
import { Faq } from './components/sections/faq'
import { FinalCta } from './components/sections/final-cta'
import { SectionDivider } from './components/sections/section-divider'

export function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <LogoStrip />
        <SectionDivider />
        <Benefits />
        <SectionDivider />
        <HowItWorks />
        <SectionDivider />
        <Integrations />
        <SectionDivider />
        <Pricing />
        <SectionDivider />
        <Faq />
        <SectionDivider />
        <FinalCta />
      </main>
      <SiteFooter />
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
