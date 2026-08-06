import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: 'esm',
  clean: true,
  sourcemap: true,
  dts: false,
  tsconfig: 'tsconfig.json',
})
