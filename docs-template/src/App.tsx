import {
  Routes,
  Route,
  Navigate,
  NavLink,
  Link,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Search,
  Moon,
  Sun,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  FileText,
  BookOpen,
  Rocket,
  Home,
  Play,
  Menu,
  X,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Check,
  CornerDownLeft,
  Hash,
} from "lucide-react";
import { Playground } from "./components/playground";
import { useBrandingConfig, brandLogoUrl, type BrandingConfig } from "./branding";
import rawDocSources from "virtual:docs-search";

/* ---------------------------------- Docs ---------------------------------- */

const docs = import.meta.glob("./docs/**/*.mdx", { eager: true }) as Record<
  string,
  { default: React.ComponentType }
>;

const rawDocs = rawDocSources as Record<string, string>;

type DocEntry = {
  slug: string;
  title: string;
  description: string;
  group: string;
  Component: React.ComponentType;
};

const SLUG_LABELS: Record<string, string> = {
  index: "Introduction",
  "getting-started": "Getting started",
  "api-reference": "API reference",
};

const ORDER: Record<string, number> = {
  index: 0,
  "getting-started": 1,
  "api-reference": 2,
};

function prettifySlug(slug: string): string {
  return slug
    .split("/")
    .pop()!
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bApi\b/g, "API")
    .replace(/\bSdk\b/g, "SDK")
    .replace(/\bCli\b/g, "CLI");
}

function groupForSlug(slug: string): string {
  if (slug === "index" || slug === "getting-started") return "Get started";
  if (slug.includes("/")) {
    return prettifySlug(slug.split("/")[0]);
  }
  return "Reference";
}

function stripInline(text: string): string {
  return text
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenDescription(text: string): string {
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  const lastStop = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? "),
  );
  if (lastStop > 60) return cut.slice(0, lastStop + 1);
  return `${cut.trimEnd()}…`;
}

function firstParagraph(raw: string): string {
  let inCode = false;
  let buffer: string[] = [];

  const finish = () => {
    const joined = stripInline(buffer.join(" "));
    buffer = [];
    return joined;
  };

  for (const line of raw.split("\n")) {
    if (/^```/.test(line)) {
      const paragraph = finish();
      if (paragraph) return shortenDescription(paragraph);
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const text = line.trim();
    const isSpecial =
      !text ||
      text.startsWith("#") ||
      text.startsWith(">") ||
      text.startsWith("|") ||
      /^([-*+]|\d+\.)\s/.test(text) ||
      /^---+$/.test(text);

    if (isSpecial) {
      const paragraph = finish();
      if (paragraph) return shortenDescription(paragraph);
      continue;
    }

    buffer.push(text);
  }

  const paragraph = finish();
  return paragraph ? shortenDescription(paragraph) : "Read the documentation.";
}

const docEntries: DocEntry[] = Object.entries(docs)
  .map(([filepath, mod]) => {
    const slug = filepath.replace("./docs/", "").replace(/\.mdx$/, "");
    return {
      slug,
      title: SLUG_LABELS[slug] ?? prettifySlug(slug),
      description: firstParagraph(rawDocs[slug] ?? ""),
      group: groupForSlug(slug),
      Component: mod.default,
    };
  })
  .sort((a, b) => {
    const ao = ORDER[a.slug] ?? 50;
    const bo = ORDER[b.slug] ?? 50;
    if (ao !== bo) return ao - bo;
    return a.slug.localeCompare(b.slug);
  });

const GROUP_ORDER = ["Get started", "Reference"];

const docGroups = (() => {
  const map = new Map<string, DocEntry[]>();
  for (const entry of docEntries) {
    const list = map.get(entry.group) ?? [];
    list.push(entry);
    map.set(entry.group, list);
  }
  return [...map.entries()].sort(([a], [b]) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b);
  });
})();

const playgroundTarget = { slug: "playground", title: "Playground" };
const navigationTargets = [
  ...docEntries.map((entry) => ({ slug: entry.slug, title: entry.title })),
  playgroundTarget,
];

const headerNav = [
  { slug: "getting-started", label: "Guides" },
  { slug: "api-reference", label: "API reference" },
  { slug: "playground", label: "Playground" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* --------------------------------- Search --------------------------------- */

type SearchSection = { id: string; heading: string; text: string };
type SearchDoc = { entry: DocEntry; sections: SearchSection[] };
type SectionHit = SearchSection & { doc: DocEntry; headingMatch: boolean };

function parseSections(raw: string): SearchSection[] {
  const sections: SearchSection[] = [];
  const seen = new Map<string, number>();
  let heading = "";
  let level = 0;
  let buffer: string[] = [];
  let inCode = false;

  const flush = () => {
    if (heading && (level === 2 || level === 3)) {
      const base = slugify(heading);
      if (base) {
        const count = (seen.get(base) ?? 0) + 1;
        seen.set(base, count);
        const id = count > 1 ? `${base}-${count}` : base;
        const text = stripInline(buffer.join(" ")).slice(0, 700);
        if (text) sections.push({ id, heading, text });
      }
    }
    buffer = [];
  };

  for (const line of raw.split("\n")) {
    if (/^```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const match = /^(#{1,6})\s+(.*)$/.exec(line);
    if (match) {
      flush();
      level = match[1].length;
      heading = stripInline(match[2]);
      continue;
    }

    if (level >= 2 && level <= 3) {
      const text = line
        .replace(/^\s*[|>]\s*/, "")
        .replace(/\s*\|\s*/g, " ")
        .trim();
      if (text) buffer.push(text);
    }
  }
  flush();
  return sections;
}

const searchIndex: SearchDoc[] = docEntries.map((entry) => {
  return { entry, sections: parseSections(rawDocs[entry.slug] ?? "") };
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchDocs(query: string): { pages: DocEntry[]; sections: SectionHit[] } {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { pages: docEntries.slice(0, 6), sections: [] };
  }

  const pages = docEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q),
  );

  const sections: SectionHit[] = [];
  for (const doc of searchIndex) {
    for (const section of doc.sections) {
      const headingMatch = section.heading.toLowerCase().includes(q);
      if (headingMatch || section.text.toLowerCase().includes(q)) {
        sections.push({ ...section, doc: doc.entry, headingMatch });
      }
    }
  }
  sections.sort((a, b) => Number(b.headingMatch) - Number(a.headingMatch));

  return { pages: pages.slice(0, 5), sections: sections.slice(0, 8) };
}

function snippet(text: string, query: string, radius = 64): string {
  const q = query.trim().toLowerCase();
  if (!q) return text.slice(0, radius * 2);
  const index = text.toLowerCase().indexOf(q);
  if (index === -1) return `${text.slice(0, radius * 2)}${text.length > radius * 2 ? "…" : ""}`;
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + q.length + radius);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "ig"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={index}
            className="rounded-[3px] bg-primary/20 px-0.5 text-foreground"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function DocIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon =
    slug === "index"
      ? Home
      : slug === "getting-started"
        ? Rocket
        : slug === "api-reference"
          ? BookOpen
          : slug === "playground"
            ? Play
            : FileText;
  return <Icon className={className} />;
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border/80 bg-muted px-1 font-sans text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

function SearchDialog({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (slug: string, hash?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchDocs(query), [query]);
  const inputRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(
    () => [
      ...results.pages.map((page) => ({ slug: page.slug, hash: undefined })),
      ...results.sections.map((section) => ({
        slug: section.doc.slug,
        hash: `#${section.id}`,
      })),
    ],
    [results],
  );

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((current) => Math.min(current + 1, Math.max(rows.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((current) => Math.max(current - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        const row = rows[active];
        if (row) {
          event.preventDefault();
          onSelect(row.slug, row.hash);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, rows, onClose, onSelect]);

  const hasResults = rows.length > 0;
  const sectionStart = results.pages.length;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/25 px-4 pt-[9vh] backdrop-blur-sm animate-in fade-in duration-150 dark:bg-black/55"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-popover shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
      >
        <div className="flex h-14 items-center gap-3 border-b border-border/70 px-4">
          <Search size={17} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documentation…"
            spellCheck={false}
            className="h-full w-full bg-transparent text-[14.5px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            esc
          </button>
        </div>

        <div className="max-h-[min(58vh,28rem)] overflow-y-auto p-2">
          {!hasResults && (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-full border border-border bg-muted/60">
                <Search size={16} className="text-muted-foreground" />
              </span>
              <p className="text-sm font-medium text-foreground">No results found</p>
              <p className="mt-1 max-w-[18rem] text-xs text-muted-foreground">
                Nothing matched “{query.trim()}”. Try searching for a page name,
                endpoint, or section.
              </p>
            </div>
          )}

          {results.pages.length > 0 && (
            <div className="mb-1">
              <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
                Pages
              </p>
              {results.pages.map((page, index) => {
                const isActive = active === index;
                return (
                  <button
                    key={page.slug}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => onSelect(page.slug)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                      isActive ? "bg-accent" : "hover:bg-accent/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md border",
                        isActive
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-border/80 bg-card text-muted-foreground",
                      )}
                    >
                      <DocIcon slug={page.slug} className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          <Highlight text={page.title} query={query} />
                        </span>
                        <span className="shrink-0 text-[10.5px] text-muted-foreground">
                          {page.group}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                        <Highlight text={page.description} query={query} />
                      </span>
                    </span>
                    <ArrowUpRight
                      size={13}
                      className={cn(
                        "shrink-0 transition-opacity",
                        isActive ? "text-primary opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {results.sections.length > 0 && (
            <div>
              <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
                Sections
              </p>
              {results.sections.map((section, index) => {
                const flatIndex = sectionStart + index;
                const isActive = active === flatIndex;
                return (
                  <button
                    key={`${section.doc.slug}-${section.id}`}
                    type="button"
                    onMouseEnter={() => setActive(flatIndex)}
                    onClick={() => onSelect(section.doc.slug, `#${section.id}`)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                      isActive ? "bg-accent" : "hover:bg-accent/60",
                    )}
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card text-muted-foreground">
                      <Hash className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate text-[13px] font-medium text-foreground">
                          <Highlight text={section.heading} query={query} />
                        </span>
                        <span className="shrink-0 truncate text-[10.5px] text-muted-foreground">
                          {section.doc.title}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                        <Highlight text={snippet(section.text, query)} query={query} />
                      </span>
                    </span>
                    <CornerDownLeft
                      size={13}
                      className={cn(
                        "mt-1 shrink-0 transition-opacity",
                        isActive ? "text-primary opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/30 px-4 py-2.5 text-[10.5px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span className="ml-0.5">navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd>
              <span className="ml-0.5">select</span>
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <Kbd>esc</Kbd>
              <span className="ml-0.5">close</span>
            </span>
          </div>
          <span className="hidden items-center gap-1.5 sm:flex">
            Search by
            <WMark className="size-3 text-primary" />
            <span className="font-medium text-foreground">Weldrr</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Brand ---------------------------------- */

function WMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ transform: "rotate(180deg)" }}
    >
      <path
        d="M4.5 19 L8.5 5 L11.5 13 L14.5 5 L18.5 19"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="21" r="1.3" fill="currentColor" />
    </svg>
  );
}

function Brand({ config, onClick }: { config: BrandingConfig; onClick?: () => void }) {
  const logoUrl = brandLogoUrl(config);
  return (
    <Link
      to="/docs/index"
      onClick={onClick}
      className="group flex min-w-0 items-center gap-2.5"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="h-7 w-auto max-w-28 shrink-0 object-contain"
        />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card shadow-soft transition-colors group-hover:border-primary/30">
          <WMark className="size-4 text-primary" />
        </span>
      )}
      <span className="min-w-0 truncate text-[14.5px] font-semibold tracking-[-0.01em] text-foreground">
        {config.siteName ?? "API Docs"}
      </span>
    </Link>
  );
}

/* -------------------------------- Theme toggle ------------------------------- */

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button
      type="button"
      onClick={() => setDark((value) => !value)}
      aria-label="Toggle theme"
      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

/* --------------------------------- Sidebar --------------------------------- */

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-6">
      {docGroups.map(([label, entries]) => (
        <div key={label}>
          <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/80">
            {label}
          </p>
          <ul className="space-y-0.5">
            {entries.map((entry) => (
              <li key={entry.slug}>
                <NavLink
                  to={`/docs/${entry.slug}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-[7px] text-[13.5px] transition-colors",
                      isActive
                        ? "bg-primary/[0.08] font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )
                  }
                >
                  <span className="truncate">{entry.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/80">
          Tools
        </p>
        <NavLink
          to="/docs/playground"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-[7px] text-[13.5px] transition-colors",
              isActive
                ? "bg-primary/[0.08] font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )
          }
        >
          <Play size={13} className="shrink-0" />
          <span>Playground</span>
        </NavLink>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-border/70 p-3">
      <a
        href="https://weldrr.app"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <span className="flex size-6 items-center justify-center rounded-md border border-border bg-card">
          <WMark className="size-3 text-primary" />
        </span>
        <span className="flex-1">
          Powered by <span className="font-medium text-foreground">Weldrr</span>
        </span>
        <ArrowUpRight size={12} />
      </a>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[17.5rem] shrink-0 flex-col border-r border-border/70 bg-sidebar/40 lg:flex">
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <SidebarNav />
      </div>
      <SidebarFooter />
    </aside>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const config = useBrandingConfig();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150 dark:bg-black/60"
        onClick={onClose}
        role="presentation"
      />
      <aside className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[86vw] flex-col border-r border-border bg-background shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-4">
          <Brand config={config} onClick={onClose} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarNav onNavigate={onClose} />
        </div>
        <SidebarFooter />
      </aside>
    </div>
  );
}

/* ------------------------------- On this page ------------------------------- */

type TocItem = { id: string; text: string; level: number };

function OnThisPage({ toc }: { toc: TocItem[] }) {
  const [active, setActive] = useState<string>(toc[0]?.id ?? "");

  useEffect(() => {
    setActive(toc[0]?.id ?? "");
  }, [toc]);

  useEffect(() => {
    if (toc.length === 0) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      let current = toc[0]?.id ?? "";
      for (const item of toc) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 100) current = item.id;
        else break;
      }
      // At the very bottom of a long page, the final section is the one in view.
      if (window.scrollY > 24) {
        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 8;
        if (atBottom) current = toc[toc.length - 1]?.id ?? current;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [toc]);

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 xl:block">
      <div className="flex h-full flex-col overflow-y-auto px-5 py-8">
        {toc.length > 0 && (
          <>
            <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/80">
              On this page
            </p>
            <ul className="border-l border-border/80">
              {toc.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        window.history.replaceState(null, "", `#${item.id}`);
                        document
                          .getElementById(item.id)
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        setActive(item.id);
                      }}
                      className={cn(
                        "-ml-px block border-l-2 py-1 text-[12px] leading-5 transition-colors",
                        item.level === 2 ? "pl-3" : "pl-6",
                        isActive
                          ? "border-primary font-medium text-foreground"
                          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      <span className="line-clamp-2">{item.text}</span>
                    </a>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-6 inline-flex items-center gap-1.5 self-start text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowUpRight size={12} className="-rotate-45" />
              Back to top
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

/* -------------------------------- Doc page -------------------------------- */

function PageFeedback() {
  const [value, setValue] = useState<"yes" | "no" | null>(null);

  if (value) {
    return (
      <div className="mt-10 flex items-center gap-2.5 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check size={13} />
        </span>
        Thanks for the feedback — it helps us improve these docs.
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col items-start justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-3.5 sm:flex-row sm:items-center">
      <p className="text-[13px] font-medium text-foreground">Was this page helpful?</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setValue("yes")}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <ThumbsUp size={12} />
          Yes
        </button>
        <button
          type="button"
          onClick={() => setValue("no")}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <ThumbsDown size={12} />
          No
        </button>
      </div>
    </div>
  );
}

function ExploreGrid({ entries }: { entries: DocEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border/80" />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
          Explore the docs
        </span>
        <span className="h-px flex-1 bg-border/80" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <Link
            key={entry.slug}
            to={`/docs/${entry.slug}`}
            className="group rounded-xl border border-border/80 bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-8 items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.07] text-primary">
                <DocIcon slug={entry.slug} className="size-4" />
              </span>
              <ArrowUpRight
                size={14}
                className="text-muted-foreground/60 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </div>
            <p className="mt-3 text-[13.5px] font-semibold text-foreground">{entry.title}</p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
              {entry.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DocShell() {
  const { "*": splat } = useParams();
  const slug = (splat || "index").replace(/\/+$/, "") || "index";
  const location = useLocation();
  const articleRef = useRef<HTMLElement>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const config = useBrandingConfig();

  const entry = docEntries.find((doc) => doc.slug === slug);
  const targetIndex = navigationTargets.findIndex((target) => target.slug === slug);
  const previous = targetIndex > 0 ? navigationTargets[targetIndex - 1] : null;
  const next =
    targetIndex >= 0 && targetIndex < navigationTargets.length - 1
      ? navigationTargets[targetIndex + 1]
      : null;

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const seen: Record<string, number> = {};
    const items: TocItem[] = [];
    el.querySelectorAll("h2, h3").forEach((heading) => {
      const text = heading.textContent?.trim() || "";
      if (!text) return;
      let id = slugify(text);
      if (!id) return;
      seen[id] = (seen[id] ?? 0) + 1;
      if (seen[id] > 1) id = `${id}-${seen[id]}`;
      heading.id = id;
      items.push({ id, text, level: heading.tagName === "H2" ? 2 : 3 });
    });
    setToc(items);
  }, [slug]);

  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug, location.hash]);

  if (!entry) {
    return (
      <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex size-11 items-center justify-center rounded-full border border-border bg-muted/50">
          <FileText size={18} className="text-muted-foreground" />
        </span>
        <p className="text-sm font-medium text-foreground">Page not found</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <Link
          to="/docs/index"
          className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
        >
          Back to docs
        </Link>
      </div>
    );
  }

  const isIndex = slug === "index";
  const exploreEntries = docEntries.filter((doc) => doc.slug !== "index");

  return (
    <div className="flex min-w-0 flex-1">
      <main className="relative min-w-0 flex-1">
        {isIndex && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(55%_100%_at_50%_0%,hsl(var(--primary)/0.09),transparent_75%)]"
          />
        )}

        <div className="relative mx-auto max-w-content px-5 pb-14 pt-9 sm:px-8 sm:pt-11">
          <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Link to="/docs/index" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            <ChevronRight size={12} className="text-muted-foreground/50" />
            <span className="truncate font-medium text-foreground/80">{entry.title}</span>
          </nav>

          {isIndex && (
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-primary">
              <Sparkles size={11} />
              API documentation
            </div>
          )}

          <article key={slug} ref={articleRef} className="prose animate-shimmer-in">
            <entry.Component />
          </article>

          {isIndex && <ExploreGrid entries={exploreEntries} />}

          <PageFeedback key={`feedback-${slug}`} />

          {(previous || next) && (
            <nav className="mt-4 grid gap-3 sm:grid-cols-2">
              {previous ? (
                <Link
                  to={`/docs/${previous.slug}`}
                  className="group flex flex-col rounded-xl border border-border/80 bg-card px-4 py-3 shadow-soft transition-all hover:border-primary/35 hover:shadow-md"
                >
                  <span className="flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    <ArrowLeft size={11} className="transition-transform group-hover:-translate-x-0.5" />
                    Previous
                  </span>
                  <span className="mt-1 truncate text-[13.5px] font-medium text-foreground group-hover:text-primary">
                    {previous.title}
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}

              {next ? (
                <Link
                  to={`/docs/${next.slug}`}
                  className="group flex flex-col items-end rounded-xl border border-border/80 bg-card px-4 py-3 text-right shadow-soft transition-all hover:border-primary/35 hover:shadow-md sm:col-start-2"
                >
                  <span className="flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Next
                    <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 truncate text-[13.5px] font-medium text-foreground group-hover:text-primary">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </nav>
          )}

          <footer className="mt-10 flex flex-col gap-2 border-t border-border/70 pt-5 text-[11.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} {config.siteName ?? "API Docs"}
            </span>
            <a
              href="https://weldrr.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <WMark className="size-3.5 text-primary" />
              Built with Weldrr
            </a>
          </footer>
        </div>
      </main>
      <OnThisPage toc={toc} />
    </div>
  );
}

/* ---------------------------------- Header --------------------------------- */

function Header({
  onOpenSearch,
  onOpenDrawer,
}: {
  onOpenSearch: () => void;
  onOpenDrawer: () => void;
}) {
  const config = useBrandingConfig();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[110rem] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation"
          className="-ml-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu size={17} />
        </button>

        <Brand config={config} />

        <span className="mx-1 hidden h-5 w-px bg-border md:block" />

        <nav className="hidden items-center gap-0.5 md:flex">
          {headerNav.map((item) => (
            <NavLink
              key={item.slug}
              to={`/docs/${item.slug}`}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden h-9 w-52 items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-2.5 text-left text-[12.5px] text-muted-foreground transition-colors hover:border-border hover:bg-muted lg:flex xl:w-64"
          >
            <Search size={14} className="shrink-0" />
            <span className="flex-1 truncate">Search docs…</span>
            <Kbd>⌘K</Kbd>
          </button>
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search documentation"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Search size={16} />
          </button>

          <ThemeToggle />

          <span className="mx-0.5 hidden h-5 w-px bg-border sm:block" />

          <Link
            to="/docs/getting-started"
            className="hidden h-9 items-center gap-1 rounded-lg bg-primary px-3.5 text-[12.5px] font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Get started
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------------- App ----------------------------------- */

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isPlayground = location.pathname.startsWith("/docs/playground");

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function goToDoc(slug: string, hash?: string) {
    navigate(`/docs/${slug}${hash ?? ""}`);
    setSearchOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onOpenSearch={() => setSearchOpen(true)} onOpenDrawer={() => setDrawerOpen(true)} />

      <div className="flex items-start">
        {!isPlayground && <Sidebar />}

        <Routes>
          <Route path="/docs/playground" element={<Playground />} />
          <Route path="/docs/*" element={<DocShell />} />
          <Route path="*" element={<Navigate to="/docs/index" replace />} />
        </Routes>
      </div>

      {drawerOpen && <MobileDrawer onClose={() => setDrawerOpen(false)} />}
      {searchOpen && (
        <SearchDialog onClose={() => setSearchOpen(false)} onSelect={goToDoc} />
      )}
    </div>
  );
}
