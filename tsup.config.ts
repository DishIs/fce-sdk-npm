import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['ws'],
  esbuildOptions(options) {
    options.banner = {
      js: '/* freecustom-email SDK — https://freecustom.email */',
    };
  },
});
