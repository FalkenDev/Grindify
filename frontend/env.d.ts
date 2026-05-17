/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />
/// <reference types="vite-plugin-vue-layouts-next/client" />
/// <reference types="vite-plugin-pwa/vue" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

declare const __APP_BUILD_INFO__: {
  version: string
  gitSha: string
  builtAt: string
  channel: string
}

declare const __APP_VERSION__: string
