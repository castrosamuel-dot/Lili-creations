import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lili-s-creations.web.app',
  integrations: [sitemap()],
  prefetch: true,
});
