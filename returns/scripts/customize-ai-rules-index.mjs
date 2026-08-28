import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const projectDescription =
  'Emporix Management Dashboard extension module — a Module Federation remote built with React, TypeScript, and Vite.'

const directoryMap = [
  '| Path | Purpose |',
  '|------|---------|',
  '| `src/RemoteComponent.tsx` | Federated entry — routing, providers, global styles |',
  '| `src/App.tsx` | Standalone dev shell (mock `appState` when not embedded in the dashboard) |',
  '| `src/main.tsx` | Local dev bootstrap |',
  '| `src/pages/` | Route-level page components |',
  '| `src/models/` | Domain types (`AppState`, `Returns`, `ApiError`) |',
  '| `src/helpers/` | Pure helpers (`settings.helpers.ts` for standalone dev) |',
  '| `src/api/` | Emporix REST API layer (`@emporix/api-calls`, `bootstrap.ts`) |',
  '| `src/context/` | `ExtensionProvider` / `useExtensionContext` — host `tenant`, `language`, `token` |',
  '| `src/translations/{locale}/` | i18n keys (react-i18next) |',
  '| `vite.config.ts` | Module Federation config, CORS, shared dependencies |',
].join('\n')

const projectRuleRow =
  '| `extension-module-template.mdc` | Always — overrides and template-only patterns (federation host, API auth, standalone dev) |'

const genericDirectoryMap =
  /<!-- CUSTOMIZE: Add a directory map for your project -->\n## Directory Map\n\n\| Path \| Purpose \|\n\|------\|---------\|\n\| `src\/pages\/` \| Route-level page components \|\n\| `src\/components\/\{feature\}\/` \| Feature UI components \|\n\| `src\/models\/` \| Domain types \|\n\| `src\/helpers\/` \| Pure business logic — \*\*never mutate models in components\*\* \|\n\| `src\/api\/` or `src\/services\/` \| REST API \/ service layer \(if applicable\) \|\n\| `src\/context\/` \| Data providers \|\n\| `src\/translations\/\{locale\}\/` \| i18n keys \(react-i18next\) \|/

const frontendAiRulesPin =
  'git+https://github.com/emporix/frontend-ai-rules.git#md-module-migration'

const customize = (content) =>
  content
    .replace(
      /<!-- CUSTOMIZE: Describe your app in one line -->\nReact \+ TypeScript \+ Vite frontend application\./,
      projectDescription
    )
    .replace(genericDirectoryMap, `## Directory Map\n\n${directoryMap}`)
    .replace(/\| _\(add project rules here\)_ \| \|/, projectRuleRow)
    .replaceAll(
      'git+https://github.com/emporix/frontend-ai-rules.git#master',
      frontendAiRulesPin
    )

const tasks = [
  '.cursorrules',
  '.github/copilot-instructions.md',
  '.claude/CLAUDE.md',
  '.cursor/rules/npm-dependencies.mdc',
  '.github/instructions/npm-dependencies.instructions.md',
  '.claude/rules/npm-dependencies.md',
]

for (const relativePath of tasks) {
  const filePath = resolve(rootDir, relativePath)
  const content = await readFile(filePath, 'utf8')
  await writeFile(filePath, customize(content))
}

console.log('Customized AI rules index files for extension module template.')
