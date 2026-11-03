import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

const corsOrigins = [
  'https://admin.emporix.io',
  'https://dev-admin.emporix.io',
  'https://stage-admin.emporix.io',
  'http://localhost:4200',
]

export default defineConfig({
  plugins: [
    react(),
    federation({
      // Must equal the MD route `key` and ExternalModule.moduleName.
      name: 'products',
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
      context: '/src/context',
      models: '/src/models',
      configs: '/src/configs',
    },
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    // Keep minify off: @originjs/vite-plugin-federation 1.4.1 mis-parses Oxc
    // template literals and emits broken dynamicLoadingCss() calls (issue #740).
    minify: false,
    cssCodeSplit: false,
    // Inline the module's few images (AI icons, product placeholder): a
    // root-relative `/assets/x.png` URL resolves against the host origin when
    // the remote is mounted in MD and 404s there.
    assetsInlineLimit: 20 * 1024,
  },
  server: {
    // Pinned so the remote does not collide with other md-extensions remotes
    // on Vite's default ports; matches VITE_PRODUCTS_URL in the MD .env.local-* files.
    port: 5178,
    strictPort: true,
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  },
  preview: {
    port: 5178,
    strictPort: true,
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  },
})
