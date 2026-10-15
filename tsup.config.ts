import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  external: ['vitepress', 'vue'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
});
