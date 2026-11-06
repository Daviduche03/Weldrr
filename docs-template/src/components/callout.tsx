import type { ComponentType, ReactNode } from "react";
import { Info, Lightbulb, TriangleAlert, ShieldAlert } from "lucide-react";

type Tone = {
  icon: ComponentType<{ className?: string }>;
  box: string;
  iconColor: string;
};

const TONES: Record<string, Tone> = {
  note: {
    icon: Info,
    box: "border-sky-500/25 bg-sky-500/[0.055]",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  tip: {
    icon: Lightbulb,
    box: "border-emerald-500/25 bg-emerald-500/[0.055]",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: TriangleAlert,
    box: "border-amber-500/30 bg-amber-500/[0.06]",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  caution: {
    icon: ShieldAlert,
    box: "border-rose-500/25 bg-rose-500/[0.055]",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  important: {
    icon: Info,
    box: "border-violet-500/25 bg-violet-500/[0.055]",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
};

function flatten(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flatten).join("");
  if (node && typeof node === "object" && "props" in node) {
    const el = node as { props: { children?: ReactNode } };
    return flatten(el.props.children);
  }
  return "";
}

/**
 * Maps MDX blockquotes to callouts. A leading "Note:", "Tip:", "Warning:"
 * or "Caution:" picks up a matching tone; anything else stays a quote.
 */
export function Callout({ children }: { children?: ReactNode }) {
  const text = flatten(children).trim();
  const toneKey = Object.keys(TONES).find((key) =>
    new RegExp(`^${key}\\b`, "i").test(text),
  );
  const tone = toneKey ? TONES[toneKey] : null;

  if (!tone) {
    return <blockquote>{children}</blockquote>;
  }

  const Icon = tone.icon;
  return (
    <div className={`callout my-6 flex gap-3 rounded-xl border px-4 py-3.5 ${tone.box}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${tone.iconColor}`} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
