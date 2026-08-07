import { defineConfig } from 'tsup'
import { cpSync, rmSync } from 'node:fs'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: 'esm',
  clean: true,
  sourcemap: true,
  dts: false,
  tsconfig: 'tsconfig.json',
  onSuccess: async () => {
    rmSync('dist/sandbox-runtime', { recursive: true, force: true })
    cpSync('src/sandbox-runtime', 'dist/sandbox-runtime', { recursive: true })
  },
})
