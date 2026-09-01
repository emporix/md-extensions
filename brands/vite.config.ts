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
      name: 'brands',
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
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    // Pinned so the remote does not collide with other md-extensions remotes
    // on Vite's default ports; matches VITE_BRANDS_URL in the MD .env.local-* files.
    port: 5175,
    strictPort: true,
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  },
  preview: {
    port: 5175,
    strictPort: true,
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  },
})
