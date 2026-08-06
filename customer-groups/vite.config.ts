import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'customerGroups',
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
    // Pinned so the remote does not collide with users-and-groups on Vite's
    // default ports; matches VITE_CUSTOMER_GROUPS_URL in the MD .env.local-* files.
    port: 5174,
    strictPort: true,
    cors: {
      origin: [
        'https://admin.emporix.io',
        'https://dev-admin.emporix.io',
        'https://stage-admin.emporix.io',
        'http://localhost:4200',
      ],
      credentials: true,
    },
  },
  preview: {
    port: 5174,
    strictPort: true,
    cors: {
      origin: [
        'https://admin.emporix.io',
        'https://dev-admin.emporix.io',
        'https://stage-admin.emporix.io',
        'http://localhost:4200',
      ],
      credentials: true,
    },
  },
})
