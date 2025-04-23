import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'emporix-product-module',
      filename: 'remoteEntry.js',
      exposes: {
        './RemoteComponent': './src/RemoteComponent',
      },
      shared: [
        'react',
        'react-dom',
        'react-router',
        'react-i18next',
        'chart.js',
        'quill',
      ],
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
})
