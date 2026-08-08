import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import path from "node:path";
import { copyFileSync, existsSync } from "node:fs";

export default defineConfig({
  base: "/",
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: "github-dark",
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
