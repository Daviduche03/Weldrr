import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  style?: CSSProperties;
  "data-language"?: string;
  "data-theme"?: string;
}

/**
 * Rendered in place of every MDX `pre` (see main.tsx).
 * rehype-pretty-code supplies `data-language` / `data-theme`; we keep the
 * tokens untouched and wrap them in a quiet, modern frame.
 */
export function CodeBlock({ children, className, title, style, ...rest }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const language = rest["data-language"] ?? findLanguage(children);
  const dataTheme = rest["data-theme"];

  async function copy() {
    try {
      await navigator.clipboard.writeText(extractText(children));
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied; fail quietly.
    }
  }

  return (
    <div className="code-block group/code relative my-5 overflow-hidden rounded-xl border border-border bg-code">
      <div className="flex h-9 items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-3.5">
        <span className="truncate font-mono text-[10.5px] font-medium uppercase tracking-[0.09em] text-muted-foreground">
          {title || language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground opacity-100 transition-colors hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover/code:opacity-100 sm:focus-visible:opacity-100"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className={className} data-language={language} data-theme={dataTheme} style={style}>
        {children}
      </pre>
    </div>
  );
}

function findLanguage(children: ReactNode): string | undefined {
  if (!children || typeof children !== "object") return undefined;
  const el = children as { props?: { className?: string; "data-language"?: string } };
  const lang = el.props?.["data-language"];
  if (lang) return lang;
  const match = /language-([\w-]+)/.exec(el.props?.className ?? "");
  return match?.[1];
}

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    const el = children as { props: { children?: ReactNode; className?: string } };
    if (el.props.className?.includes("language-")) {
      return extractText(el.props.children);
    }
    if (el.props.className?.includes("line")) {
      return extractText(el.props.children);
    }
    return extractText(el.props.children);
  }
  return "";
}
