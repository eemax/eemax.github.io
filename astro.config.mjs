// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://eemax.github.io',
  output: 'static',
  build: {
    assets: '_assets',
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      target: 'esnext',
    },
    assetsInclude: ['**/*.glsl'],
  },
});
