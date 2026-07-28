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
    alias: [
      {
        find: '@emporix/component-library/styles',
        replacement: '../../component-library/dist/style.css',
      },
      {
        find: '@emporix/component-library',
        replacement: '../../component-library/dist/index.es.js',
      },
      { find: 'components', replacement: '/src/components' },
      { find: 'api', replacement: '/src/api' },
      { find: 'helpers', replacement: '/src/helpers' },
      { find: 'hooks', replacement: '/src/hooks' },
      { find: 'layouts', replacement: '/src/layouts' },
      { find: 'context', replacement: '/src/context' },
      { find: 'modules', replacement: '/src/modules' },
      { find: 'models', replacement: '/src/models' },
    ],
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
})
