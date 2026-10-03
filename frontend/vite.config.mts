/// <reference types="vitest/config" />

// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Fonts from 'unplugin-fonts/vite'
import Layouts from 'vite-plugin-vue-layouts-next'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'

// Utilities
import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const appBuildInfo = {
  version: process.env.APP_VERSION || process.env.npm_package_version || '0.0.0',
  gitSha: process.env.APP_GIT_SHA || 'unknown',
  builtAt: process.env.APP_BUILD_TIME || new Date().toISOString(),
  channel: process.env.APP_CHANNEL || 'local',
}

const versionManifestPlugin: Plugin = {
  name: 'version-manifest',
  apply: 'build' as const,
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify(appBuildInfo, null, 2),
    })
  },
}

/**
 * Inject absolute og:image / og:url when VITE_PUBLIC_URL is set (e.g. https://grindify.example.com).
 * Social crawlers require absolute URLs, so the tags are omitted when it is not configured.
 */
const socialMetaPlugin = (): Plugin => {
  let publicUrl = ''
  return {
    name: 'social-meta',
    configResolved(config) {
      publicUrl = String(config.env.VITE_PUBLIC_URL || process.env.VITE_PUBLIC_URL || '')
        .trim()
        .replace(/\/+$/, '')
    },
    transformIndexHtml() {
      if (!/^https?:\/\//.test(publicUrl)) return []
      const meta = (attrs: Record<string, string>) => ({ tag: 'meta', attrs, injectTo: 'head' as const })
      return [
        meta({ property: 'og:url', content: `${publicUrl}/` }),
        meta({ property: 'og:image', content: `${publicUrl}/og-image.png` }),
        meta({ property: 'og:image:width', content: '1200' }),
        meta({ property: 'og:image:height', content: '630' }),
        meta({ property: 'og:image:alt', content: 'Grindify logo' }),
        meta({ name: 'twitter:image', content: `${publicUrl}/og-image.png` }),
      ]
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    versionManifestPlugin,
    socialMetaPlugin(),
    VueRouter({
      dts: 'src/typed-router.d.ts',
    }),
    Layouts(),
    AutoImport({
      imports: [
        'vue',
        VueRouterAutoImports,
        {
          pinia: ['defineStore', 'storeToRefs'],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
    Components({
      dts: 'src/components.d.ts',
    }),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icons/*.png', 'apple-splash/*.png'],
      manifest: {
        name: 'Grindify',
        short_name: 'Grindify',
        description: 'Your personal fitness training companion',
        theme_color: '#0C0E12',
        background_color: '#0C0E12',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'upload-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:woff2?|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  optimizeDeps: {
    exclude: [
      'vuetify',
      'vue-router',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
    ],
  },
  define: {
    'process.env': {},
    __APP_VERSION__: JSON.stringify(appBuildInfo.version),
    __APP_BUILD_INFO__: JSON.stringify(appBuildInfo),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    host: true, // bind to 0.0.0.0 so external devices can connect
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',').map(h => h.trim())
      : undefined,
    port: 3000,
    watch: {
      usePolling: true,
    },
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
      },
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})
