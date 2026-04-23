/**
 * Lists TS/TSX/SCSS reachable from extension entry points vs all files on disk.
 * Run: node scripts/audit-extension-imports.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

const ENTRIES = [
  path.join(SRC, 'RemoteComponent.tsx'),
  path.join(SRC, 'App.tsx'),
  path.join(SRC, 'main.tsx'),
]

const ALIAS_PREFIXES = [
  ['models/', path.join(SRC, 'models')],
  ['components/', path.join(SRC, 'components')],
  ['context/', path.join(SRC, 'context')],
  ['hooks/', path.join(SRC, 'hooks')],
  ['helpers/', path.join(SRC, 'helpers')],
  ['api/', path.join(SRC, 'api')],
  ['modules/', path.join(SRC, 'modules')],
]

const importRe =
  /(?:import|export)\s+(?:type\s+)?[^'";]*?from\s+['"]([^'"]+)['"]/g
const importSideRe = /import\s+['"]([^'"]+)['"]/g

function tryFile(base) {
  const attempts = [
    base,
    base + '.ts',
    base + '.tsx',
    base + '.scss',
    base + '.css',
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]
  for (const p of attempts) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return path.normalize(p)
  }
  return null
}

function resolveSpec(fromFile, spec) {
  if (
    spec.startsWith('node_modules') ||
    spec.startsWith('/node_modules') ||
    spec.startsWith('\0') ||
    (!spec.startsWith('.') && !spec.startsWith('/') && !ALIAS_PREFIXES.some(([p]) => spec.startsWith(p)))
  ) {
    if (spec.startsWith('@/') || spec.startsWith('')) {
      /* bare package name */
    }
    if (!spec.startsWith('.') && !spec.startsWith('/')) {
      const isAlias = ALIAS_PREFIXES.some(([pre]) => spec === pre.slice(0, -1) || spec.startsWith(pre))
      if (!isAlias) return null
    }
  }

  if (spec.startsWith('.')) {
    const base = path.resolve(path.dirname(fromFile), spec)
    return tryFile(base.replace(/\.tsx?$/, '')) || tryFile(base)
  }

  for (const [prefix, dir] of ALIAS_PREFIXES) {
    if (spec === prefix.slice(0, -1)) {
      return tryFile(path.join(dir))
    }
    if (spec.startsWith(prefix)) {
      const sub = spec.slice(prefix.length)
      const base = path.join(dir, sub)
      return tryFile(base.replace(/\.tsx?$/, '')) || tryFile(base)
    }
  }

  if (spec.startsWith('/src/')) {
    const base = path.join(ROOT, spec.slice(1))
    return tryFile(base.replace(/\.tsx?$/, '')) || tryFile(base)
  }

  return null
}

function walkGraph() {
  const queue = [...ENTRIES]
  const seen = new Set()
  while (queue.length) {
    const file = queue.pop()
    if (!file || seen.has(file)) continue
    if (!file.startsWith(SRC)) continue
    seen.add(file)
    if (!/\.(tsx?|scss|css)$/.test(file)) continue
    let body
    try {
      body = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }
    const specs = new Set()
    let m
    importRe.lastIndex = 0
    while ((m = importRe.exec(body))) specs.add(m[1])
    importSideRe.lastIndex = 0
    while ((m = importSideRe.exec(body))) specs.add(m[1])

    for (const spec of specs) {
      const resolved = resolveSpec(file, spec)
      if (resolved && resolved.startsWith(SRC)) queue.push(resolved)
    }
  }
  return seen
}

function allTrackedFiles() {
  const out = []
  function walk(d) {
    for (const name of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, name.name)
      if (name.isDirectory()) walk(p)
      else if (/\.(tsx?|scss)$/.test(name.name)) out.push(path.normalize(p))
    }
  }
  walk(SRC)
  return out
}

const reached = walkGraph()
const all = allTrackedFiles()
const unreached = all.filter((f) => !reached.has(f))
const extraReach = [...reached].filter((f) => !all.includes(f))

const viteEnv = path.join(SRC, 'vite-env.d.ts')
const reachedNoDeclarations = [...reached].filter(
  (f) => !f.endsWith('.d.ts') && f !== viteEnv
)

console.log('=== Extension import audit (customers) ===\n')
console.log('Entry points:', ENTRIES.map((e) => path.relative(ROOT, e)).join(', '))
console.log('Reachable under src/:', reached.size)
console.log('Total .ts/.tsx/.scss under src/:', all.length)
console.log('\n--- Likely UNUSED (not reachable from entries) ---\n')
for (const f of unreached.sort()) {
  if (f.endsWith('vite-env.d.ts')) continue
  console.log(path.relative(ROOT, f))
}

if (extraReach.length) {
  console.log('\n(resolved paths outside allTracked list:', extraReach.length, ')')
}
