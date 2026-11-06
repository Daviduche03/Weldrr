import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import path from "node:path";
import { copyFileSync, existsSync, readdirSync, readFileSync } from "node:fs";

/**
 * Exposes the raw MDX sources as a virtual module (`virtual:docs-search`) so
 * the client can build a full-text search index without pulling the MDX
 * pipeline into raw imports.
 */
function docsSourcePlugin(): Plugin {
  const virtualId = "virtual:docs-search";
  const resolvedId = `\0${virtualId}`;
  const docsDir = path.resolve(__dirname, "src/docs");

  function readDocs(dir: string, base = dir): Record<string, string> {
    const out: Record<string, string> = {};
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        Object.assign(out, readDocs(full, base));
      } else if (entry.name.endsWith(".mdx")) {
        const slug = path
          .relative(base, full)
          .replace(/\\/g, "/")
          .replace(/\.mdx$/, "");
        out[slug] = readFileSync(full, "utf8");
      }
    }
    return out;
  }

  return {
    name: "weldrr-docs-source",
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) {
        return `export default ${JSON.stringify(readDocs(docsDir))}`;
      }
    },
    configureServer(server) {
      server.watcher.add(docsDir);
      const reload = (file: string) => {
        if (!file.startsWith(docsDir) || !file.endsWith(".mdx")) return;
        const mod = server.moduleGraph.getModuleById(resolvedId);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", reload);
      server.watcher.on("change", reload);
      server.watcher.on("unlink", reload);
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [
    docsSourcePlugin(),
    {
      enforce: "pre",
      ...mdx({
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: {
                light: "github-light",
                dark: "github-dark",
              },
              keepBackground: false,
            },
          ],
        ],
      }),
    },
    react({ include: /\.(mdx|tsx)$/ }),
    {
      name: "copy-branding-json",
      apply: "build",
      closeBundle() {
        // branding.json lives at the repo root (written by the Weldrr editor);
        // copy it into dist so the site can fetch /branding.json at runtime.
        const src = path.resolve(__dirname, "branding.json");
        const dest = path.resolve(__dirname, "dist", "branding.json");
        if (existsSync(src)) copyFileSync(src, dest);
      },
    },
  ],
  resolve: {
    alias: {
      "@docs": path.resolve(__dirname, "./src/docs"),
    },
  },
  build: {
    outDir: "dist",
  },
});
