import path from 'node:path';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',

  vite: () => ({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@background': path.resolve(__dirname, 'src/background'),
      },
    },
  }),

  manifest: ({ browser }) => ({
    name: '__MSG_EXTENSION_NAME__',
    description: '__MSG_EXTENSION_DESCRIPTION__',
    version: '1.0.3',
    author: 'CookiePeek <support@cookiepeek.com>',
    homepage_url: 'https://cookiepeek.com',
    default_locale: 'en',

    permissions: ['cookies', 'activeTab'],
    host_permissions: ['<all_urls>'],

    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },

    icons: {
      16: 'icons/16.png',
      32: 'icons/32.png',
      48: 'icons/48.png',
      128: 'icons/128.png',
    },

    // ---- Browser-specific ----

    ...(browser === 'chrome' && {
      minimum_chrome_version: '116',
    }),

    ...(browser === 'edge' && {
      minimum_chrome_version: '116',
    }),

    ...(browser === 'opera' && {
      minimum_chrome_version: '116',
    }),

    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'cookiepeek@cookiepeek.com',
          strict_min_version: '142.0',
          data_collection_permissions: {
            required: ['none'],
          },
        },
      },
    }),
  }),

  browser: 'chrome',
});
