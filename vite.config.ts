import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs so the build runs from GitHub Pages project paths,
  // plain static hosts, or any subdirectory.
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
  server: {
    host: true,
    port: 5173,
  },
});
