import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Check,
  Send,
  LoaderCircle,
  TerminalSquare,
  Plus,
  X,
  ShieldAlert,
  Search,
  KeyRound,
} from "lucide-react";
import endpointsData from "../data/endpoints.json";

type Param = { name: string; in: "path" | "query"; type: string; required?: boolean };
type Endpoint = {
  method: string;
  path: string;
  summary?: string;
  operationId?: string;
  params?: Param[];
  requestBody?: { contentType?: string; schema?: string } | null;
  responses?: { status: string; schema?: string }[];
  auth?: string;
};

type HeaderRow = { id: number; name: string; value: string };

type EndpointsData = { baseUrl: string; proxyUrl?: string; endpoints: Endpoint[] };
const data = endpointsData as EndpointsData;

const methodColors: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-sky-600 dark:text-sky-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-violet-600 dark:text-violet-400",
  DELETE: "text-rose-600 dark:text-rose-400",
};

const methodChip: Record<string, string> = {
  GET: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  POST: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  PUT: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PATCH: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  DELETE: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[12.5px] text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/15";

function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  if (status >= 300 && status < 400) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }
  return "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400";
}

export function Playground() {
  const [selected, setSelected] = useState(0);
  const [baseUrl, setBaseUrl] = useState(data.baseUrl);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("weldrr-pg-token") ?? "");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState("");
  const [customHeaders, setCustomHeaders] = useState<HeaderRow[]>([]);
  const [proxyUsed, setProxyUsed] = useState(false);
  const [showCurl, setShowCurl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    body: string;
    timeMs: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endpoint = data.endpoints[selected];

  useEffect(() => {
    setParamValues({});
    setBodyText("");
    setCustomHeaders([]);
    setProxyUsed(false);
    setResponse(null);
    setError(null);
  }, [selected]);

  useEffect(() => {
    localStorage.setItem("weldrr-pg-token", authToken);
  }, [authToken]);

  const filteredEndpoints = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return data.endpoints
      .map((ep, index) => ({ ep, index }))
      .filter(
        ({ ep }) =>
          !q ||
          ep.path.toLowerCase().includes(q) ||
          ep.method.toLowerCase().includes(q) ||
          (ep.summary ?? "").toLowerCase().includes(q),
      );
  }, [filter]);

  const pathParams = useMemo(
    () => (endpoint.params ?? []).filter((p) => p.in === "path"),
    [endpoint],
  );
  const queryParams = useMemo(
    () => (endpoint.params ?? []).filter((p) => p.in === "query"),
    [endpoint],
  );

  function buildUrl(): string {
    let path = endpoint.path;
    for (const p of pathParams) {
      const value = (paramValues[p.name] ?? "").trim();
      path = path.replace(`:${p.name}`, encodeURIComponent(value || p.name));
    }
    const qs = queryParams
      .filter((p) => (paramValues[p.name] ?? "").trim() !== "")
      .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(paramValues[p.name].trim())}`);
    return `${baseUrl.replace(/\/+$/, "")}${path}${qs.length ? `?${qs.join("&")}` : ""}`;
  }

  function customHeaderPairs(): { name: string; value: string }[] {
    return customHeaders
      .map((h) => ({ name: h.name.trim(), value: h.value.trim() }))
      .filter((h) => h.name !== "");
  }

  function buildCurl(): string {
    const url = buildUrl();
    const parts = [`curl -X ${endpoint.method} '${url}'`];
    for (const h of customHeaderPairs()) {
      parts.push(`-H '${h.name}: ${h.value.replace(/'/g, "'\\''")}'`);
    }
    if (authToken) parts.push(`-H 'Authorization: Bearer ${authToken}'`);
    if (endpoint.requestBody && bodyText.trim()) {
      parts.push(`-H 'Content-Type: application/json'`);
      parts.push(`-d '${bodyText.replace(/'/g, "'\\''")}'`);
    }
    return parts.join(" \\\n  ");
  }

  async function doFetch(
    url: string,
    viaProxy: boolean,
  ): Promise<{ status: number; statusText: string; body: string }> {
    const headers: Record<string, string> = {};
    for (const h of customHeaderPairs()) headers[h.name] = h.value;
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    if (endpoint.requestBody && bodyText.trim()) headers["Content-Type"] = "application/json";

    if (viaProxy) {
      const proxyUrl = data.proxyUrl?.replace(/\/+$/, "");
      if (!proxyUrl) throw new Error("No proxy configured for this docs site");
      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          method: endpoint.method,
          headers,
          body: endpoint.requestBody && bodyText.trim() ? bodyText : undefined,
        }),
        signal: AbortSignal.timeout(40_000),
      });
      const text = await res.text();
      return { status: res.status, statusText: res.statusText || "", body: text };
    }

    const res = await fetch(url, {
      method: endpoint.method,
      headers,
      body: endpoint.requestBody && bodyText.trim() ? bodyText : undefined,
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    return { status: res.status, statusText: res.statusText, body: text };
  }

  async function send() {
    setLoading(true);
    setError(null);
    setResponse(null);
    setProxyUsed(false);
    const started = performance.now();
    const url = buildUrl();
    try {
      const result = await doFetch(url, false);
      setResponse({ ...result, timeMs: performance.now() - started });
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort && data.proxyUrl) {
        try {
          const proxied = await doFetch(url, true);
          setProxyUsed(true);
          setResponse({ ...proxied, timeMs: performance.now() - started });
          return;
        } catch {
          // fall through to the direct-fetch error message
        }
      }
      setError(
        err instanceof Error
          ? isAbort
            ? "Request timed out after 30s."
            : `Could not reach the API directly (${err.message}). This is usually a CORS block — the request was not sent to the server. Use the cURL command, or if a proxy is configured, it will be attempted automatically.`
          : "Request failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyCurl() {
    try {
      await navigator.clipboard.writeText(buildCurl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard failures
    }
  }

  async function copyResponse() {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(prettyJson(response.body));
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 1500);
    } catch {
      // ignore clipboard failures
    }
  }

  function renderResponse(inline = false) {
    return (
      <div
        className={
          inline
            ? "flex min-h-[16rem] flex-col border-t border-border/70"
            : "flex min-h-0 flex-1 flex-col"
        }
      >
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/70 px-4">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Response
          </span>
          {response && (
            <>
              <span
                className={`ml-auto rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${statusColor(response.status)}`}
              >
                {response.status} {response.statusText}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {response.timeMs.toFixed(0)}ms
              </span>
              <button
                type="button"
                onClick={copyResponse}
                aria-label="Copy response"
                className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {copiedResponse ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </>
          )}
          {proxyUsed && response && (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
              title="The browser could not reach the API directly (CORS), so this request was relayed through a server-side proxy."
            >
              <ShieldAlert size={10} />
              proxy
            </span>
          )}
        </div>
        <div
          className={
            "min-h-0 flex-1 overflow-auto bg-muted/20 p-4"
          }
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-[12.5px] text-muted-foreground">
              <LoaderCircle size={15} className="mr-2 animate-spin" />
              Sending request…
            </div>
          ) : error ? (
            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-rose-600 dark:text-rose-400">
              {error}
            </pre>
          ) : response ? (
            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-foreground/90">
              {prettyJson(response.body)}
            </pre>
          ) : (
            <div className="flex h-full min-h-[10rem] flex-col items-center justify-center gap-2 text-center">
              <span className="flex size-9 items-center justify-center rounded-full border border-border bg-card">
                <TerminalSquare size={15} className="text-muted-foreground" />
              </span>
              <p className="max-w-[16rem] text-[12px] text-muted-foreground">
                Send a request to see the response, status code, and timing here.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-1">
      {/* Endpoint rail */}
      <aside className="hidden w-[19rem] shrink-0 flex-col border-r border-border/70 bg-sidebar/40 lg:flex">
        <div className="border-b border-border/70 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
              Endpoints
            </span>
            <span className="rounded-full border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {data.endpoints.length}
            </span>
          </div>
          <div className="relative mt-3">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter endpoints…"
              spellCheck={false}
              className="h-8 w-full rounded-lg border border-border/80 bg-background pl-8 pr-2.5 text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {filteredEndpoints.map(({ ep, index }) => (
            <button
              key={`${ep.method}-${ep.path}`}
              type="button"
              onClick={() => setSelected(index)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                index === selected
                  ? "bg-muted/80"
                  : "hover:bg-muted/50"
              }`}
            >
              <span
                className={`w-11 shrink-0 font-mono text-[10px] font-semibold ${methodColors[ep.method] ?? "text-muted-foreground"}`}
              >
                {ep.method}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[11.5px] text-foreground/85">
                  {ep.path}
                </span>
                {ep.summary && (
                  <span className="mt-0.5 block truncate text-[10.5px] text-muted-foreground">
                    {ep.summary}
                  </span>
                )}
              </span>
              {index === selected && (
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))}
          {filteredEndpoints.length === 0 && (
            <p className="px-3 py-6 text-center text-[11.5px] text-muted-foreground">
              No endpoints match “{filter}”.
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 xl:flex-row">
        {/* Request builder */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border/70 px-4 py-3 sm:px-5">
            <div className="lg:hidden">
              <label
                htmlFor="endpoint-select"
                className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              >
                Endpoint
              </label>
              <select
                id="endpoint-select"
                value={selected}
                onChange={(event) => setSelected(Number(event.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-background px-2.5 font-mono text-[12px] text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              >
                {data.endpoints.map((ep, index) => (
                  <option key={`${ep.method}-${ep.path}`} value={index}>
                    {ep.method} {ep.path}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex items-center gap-2.5 lg:mt-0">
              <span
                className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${methodChip[endpoint.method] ?? "border-border bg-muted text-muted-foreground"}`}
              >
                {endpoint.method}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">
                {endpoint.path}
              </span>
              {endpoint.auth && (
                <span className="hidden shrink-0 items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
                  <KeyRound size={9} />
                  {endpoint.auth}
                </span>
              )}
            </div>
            {endpoint.summary && (
              <p className="mt-1.5 hidden text-[12px] text-muted-foreground sm:block">
                {endpoint.summary}
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-5 p-4 sm:p-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                  Base URL
                </label>
                <input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  spellCheck={false}
                  className={inputClass}
                />
              </div>

              {(pathParams.length > 0 || queryParams.length > 0) && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                    Parameters
                  </label>
                  <div className="space-y-2">
                    {[...pathParams, ...queryParams].map((p) => (
                      <div key={p.name} className="flex items-center gap-2.5">
                        <span className="w-24 shrink-0 truncate font-mono text-[11.5px] text-muted-foreground">
                          {p.name}
                          {p.in === "query" && (
                            <span className="text-muted-foreground/50">?</span>
                          )}
                        </span>
                        <input
                          value={paramValues[p.name] ?? ""}
                          onChange={(event) =>
                            setParamValues((values) => ({
                              ...values,
                              [p.name]: event.target.value,
                            }))
                          }
                          placeholder={p.required ? `${p.name} (required)` : `${p.name} (optional)`}
                          spellCheck={false}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                  Authorization
                </label>
                <input
                  value={authToken}
                  onChange={(event) => setAuthToken(event.target.value)}
                  placeholder="API key or bearer token"
                  spellCheck={false}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Headers
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomHeaders((headers) => [
                        ...headers,
                        { id: Date.now(), name: "", value: "" },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
                  >
                    <Plus size={11} />
                    Add header
                  </button>
                </div>
                {customHeaders.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/70">
                    Optional custom headers (e.g. <span className="font-mono">X-API-Key</span>).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customHeaders.map((header) => (
                      <div key={header.id} className="flex items-center gap-2">
                        <input
                          value={header.name}
                          onChange={(event) =>
                            setCustomHeaders((headers) =>
                              headers.map((item) =>
                                item.id === header.id
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Header"
                          spellCheck={false}
                          className={`${inputClass} w-32 shrink-0`}
                        />
                        <input
                          value={header.value}
                          onChange={(event) =>
                            setCustomHeaders((headers) =>
                              headers.map((item) =>
                                item.id === header.id
                                  ? { ...item, value: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Value"
                          spellCheck={false}
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCustomHeaders((headers) =>
                              headers.filter((item) => item.id !== header.id),
                            )
                          }
                          aria-label="Remove header"
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {endpoint.requestBody && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                    Request body <span className="text-muted-foreground/50">(JSON)</span>
                  </label>
                  <textarea
                    value={bodyText}
                    onChange={(event) => setBodyText(event.target.value)}
                    rows={6}
                    spellCheck={false}
                    placeholder={endpoint.requestBody.schema ? `// ${endpoint.requestBody.schema}` : "{}"}
                    className={`${inputClass} resize-y leading-relaxed`}
                  />
                </div>
              )}
            </div>

            {/* Response on small screens */}
            <div className="xl:hidden">{renderResponse(true)}</div>
          </div>

          <div className="shrink-0 border-t border-border/70 bg-background/60 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={send}
                disabled={loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[12.5px] font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                {loading ? "Sending…" : "Send request"}
              </button>
              <button
                type="button"
                onClick={() => setShowCurl((value) => !value)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <TerminalSquare size={13} />
                cURL
              </button>
              {showCurl && (
                <button
                  type="button"
                  onClick={copyCurl}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            {showCurl && (
              <pre className="mt-2.5 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border/70 bg-muted/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {buildCurl()}
              </pre>
            )}
          </div>
        </div>

        {/* Response on large screens */}
        <aside className="hidden w-[25rem] shrink-0 flex-col border-l border-border/70 xl:flex">
          {renderResponse()}
        </aside>
      </div>
    </div>
  );
}
