import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scssVariablesHref = pathToFileURL(
  path.resolve(__dirname, 'src/scss/_variables.scss')
).href

/** Dev: MD often points at …/assets/remoteEntry.js (prod layout); Vite serves the entry at /remoteEntry.js. */
const devRemoteEntryAssetsAlias = (): Plugin => ({
  name: 'dev-remote-entry-assets-alias',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url?.startsWith('/assets/remoteEntry.js')) {
        req.url = req.url.replace(/^\/assets\/remoteEntry\.js/, '/remoteEntry.js')
      }
      next()
    })
  },
})

/** Align with other md-extensions remotes (dashboard, statistics, agentic-ai). */
const corsAllowlist = {
  origin: [
    'https://admin.emporix.io',
    'https://dev-admin.emporix.io',
    'https://stage-admin.emporix.io',
    'http://localhost:4200',
  ],
  credentials: true,
}

export default defineConfig({
  /**
   * `vite` dev does not produce a real federated remoteEntry for @originjs/vite-plugin-federation
   * (requests hit SPA fallback → HTML). For MD / dynamic import, use `yarn serve:prod` or
   * `yarn build:prod:watch` + `vite preview` so `remoteEntry.js` is actual JavaScript.
   */
  server: {
    cors: corsAllowlist,
  },
  preview: {
    cors: corsAllowlist,
    port: 5173,
    strictPort: false,
  },
  plugins: [
    devRemoteEntryAssetsAlias(),
    react(),
    federation({
      name: 'emporix-customer-module',
      filename: 'remoteEntry.js',
      exposes: {
        './RemoteComponent': './src/RemoteComponent',
      },
      shared: ['react', 'react-dom', 'react-router', 'react-i18next'],
    }),
  ],
  resolve: {
    alias: {
      components: '/src/components',
      api: '/src/api',
      helpers: '/src/helpers',
      hooks: '/src/hooks',
      layouts: '/src/layouts',
      context: '/src/context',
      modules: '/src/modules',
      models: '/src/models',
    },
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Absolute file URL: Vite does not always forward includePaths to Sass.
        additionalData: `@use "${scssVariablesHref}" as *;\n`,
      },
    },
  },
})
