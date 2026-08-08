import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type BrandingConfig = {
  siteName?: string;
  font?: string;
  colors?: { primary?: string; accent?: string };
  logo?: string;
  favicon?: string;
  ogImage?: string;
};

const BrandingContext = createContext<BrandingConfig>({});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { config } = useBranding();
  return <BrandingContext.Provider value={config}>{children}</BrandingContext.Provider>;
}

export function useBrandingConfig(): BrandingConfig {
  return useContext(BrandingContext);
}

const FONT_STACKS: Record<string, string> = {
  system: "system-ui, -apple-system, sans-serif",
  geist: "'Geist Variable', system-ui, -apple-system, sans-serif",
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'Geist Mono Variable', ui-monospace, monospace",
};

function applyBranding(cfg: BrandingConfig) {
  const root = document.documentElement;

  // Site name / title
  if (cfg.siteName) {
    document.title = cfg.siteName;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", cfg.siteName);
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", cfg.siteName);
  }

  // Colors -> CSS variables (hex input)
  if (cfg.colors?.primary) {
    root.style.setProperty("--primary", hexToHsl(cfg.colors.primary));
  }
  if (cfg.colors?.accent) {
    root.style.setProperty("--accent", hexToHsl(cfg.colors.accent));
    root.style.setProperty("--ring", hexToHsl(cfg.colors.accent));
  }

  // Font
  if (cfg.font && FONT_STACKS[cfg.font]) {
    root.style.setProperty("--font-sans", FONT_STACKS[cfg.font]);
  }

  // Favicon
  if (cfg.favicon) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = cfg.favicon;
  }

  // OG image
  if (cfg.ogImage) {
    const ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute("content", cfg.ogImage);
  }

  // Logo is handled by the Brand component via the hook return.
}

/** Convert a #rrggbb hex to an HSL "h s% l%" string used by the CSS vars. */
export function hexToHsl(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "262 100% 65%";
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useBranding(): { config: BrandingConfig; loaded: boolean } {
  const [config, setConfig] = useState<BrandingConfig>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/branding.json")
      .then((res) => (res.ok ? res.json() : {}))
      .then((cfg: BrandingConfig) => {
        if (cancelled) return;
        setConfig(cfg);
        applyBranding(cfg);
      })
      .catch(() => {
        if (!cancelled) setConfig({});
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loaded };
}

export function brandLogoUrl(config: BrandingConfig): string | null {
  return config.logo ?? null;
}
