import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'

const BANNED_PACKAGES = [
  'react-router*',
  'react-router*/**',
  'react-i18next',
  'react-i18next/**',
  'i18next',
  'i18next/**',
]

// The package keeps no knowledge of the app around it: its imports stay
// inside audit-log/, so a relative import may climb out of src/ but no further.
const restrictedImports = (leavingPackage) => [
  'error',
  {
    patterns: [
      {
        group: BANNED_PACKAGES,
        message: 'The package is router and i18n free.',
      },
      { group: [leavingPackage], message: 'Imports stay inside audit-log/.' },
    ],
  },
]

export default tseslint
  .config(
    { ignores: ['dist'] },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
      },
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': [
          'warn',
          { allowConstantExport: true },
        ],
        'no-restricted-imports': restrictedImports('../../**'),
      },
    },
    {
      files: ['src/*/**/*.{ts,tsx}'],
      rules: { 'no-restricted-imports': restrictedImports('../../../**') },
    }
  )
  .concat(eslintPluginPrettier)
