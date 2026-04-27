import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [mdx(), react()],
  base: '/',
  site: 'https://roshanravani.github.io',
  build: {
    assets: '_assets'
  }
});