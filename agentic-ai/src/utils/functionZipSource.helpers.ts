import JSZip from 'jszip'

const normalizeSlashes = (path: string) => path.replace(/\\/g, '/')

export const MAX_ZIP_DOWNLOAD_BYTES = 20 * 1024 * 1024
export const MAX_ZIP_SOURCE_ENTRIES = 500
export const MAX_ZIP_UNCOMPRESSED_BYTES = 50 * 1024 * 1024
export const MAX_ZIP_SOURCE_FILE_BYTES = 2 * 1024 * 1024

export const isZipJunkPath = (path: string): boolean => {
  const normalized = normalizeSlashes(path)
  if (normalized === '' || normalized === '.' || normalized === '..') {
    return true
  }
  if (normalized === '.DS_Store' || normalized.endsWith('/.DS_Store')) {
    return true
  }
  if (normalized === 'Thumbs.db' || normalized.endsWith('/Thumbs.db')) {
    return true
  }
  if (normalized === '__MACOSX' || normalized.startsWith('__MACOSX/')) {
    return true
  }
  return false
}

export const hasZipPathTraversalSegment = (path: string): boolean => {
  const segments = normalizeSlashes(path).split('/').filter(Boolean)
  return segments.some((segment) => segment === '..')
}

const SKIP_DIR_SEGMENTS = new Set([
  'node_modules',
  '.git',
  '__pycache__',
  'dist',
  'build',
  '.venv',
  'venv',
  '.tox',
  'coverage',
  '.next',
  '.nuxt',
  'target',
])

const SKIP_FILE_NAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'poetry.lock',
  'Pipfile.lock',
])

const JS_TS_PYTHON_EXTENSIONS = [
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.py',
  '.pyw',
  '.pyi',
]

const JS_TS_PYTHON_PROJECT_FILES = [
  'package.json',
  'tsconfig.json',
  'jsconfig.json',
  'requirements.txt',
  'pyproject.toml',
  'setup.py',
  'setup.cfg',
  'pipfile',
]

export const isFunctionSourceTextFilePath = (path: string): boolean => {
  const lowerPath = path.toLowerCase()
  const fileName = lowerPath.split('/').pop() ?? ''
  if (SKIP_FILE_NAMES.has(fileName)) {
    return false
  }
  if (JS_TS_PYTHON_PROJECT_FILES.includes(fileName)) {
    return true
  }
  return JS_TS_PYTHON_EXTENSIONS.some((ext) => lowerPath.endsWith(ext))
}

export const shouldSkipZipSourcePath = (path: string): boolean => {
  if (isZipJunkPath(path) || hasZipPathTraversalSegment(path)) {
    return true
  }
  const segments = normalizeSlashes(path).split('/').filter(Boolean)
  return segments.some((segment) =>
    SKIP_DIR_SEGMENTS.has(segment.toLowerCase())
  )
}

export const findSingleRootFolderPrefix = (paths: string[]): string | null => {
  if (paths.length === 0) {
    return null
  }

  const segmentLists = paths.map((path) =>
    normalizeSlashes(path).split('/').filter(Boolean)
  )

  const firstSegments = new Set(segmentLists.map((segments) => segments[0]))
  if (firstSegments.size !== 1) {
    return null
  }

  const rootName = segmentLists[0][0]
  if (!rootName) {
    return null
  }

  const allUnderThatFolder = segmentLists.every(
    (segments) => segments.length >= 2
  )
  if (!allUnderThatFolder) {
    return null
  }

  return `${rootName}/`
}

export const stripLeadingFolderPrefix = (
  path: string,
  prefix: string
): string => {
  const normalized = normalizeSlashes(path)
  if (!prefix.endsWith('/')) {
    return normalized
  }
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length)
  }
  return normalized
}

export const normalizeZipSourceEntryPath = (
  rawPath: string,
  stripPrefix: string | null
): string | null => {
  if (isZipJunkPath(rawPath) || hasZipPathTraversalSegment(rawPath)) {
    return null
  }
  let path = normalizeSlashes(rawPath).replace(/^\/+/, '')
  if (path === '' || path.endsWith('/')) {
    return null
  }
  if (stripPrefix) {
    path = stripLeadingFolderPrefix(path, stripPrefix)
  }
  if (
    path === '' ||
    isZipJunkPath(path) ||
    hasZipPathTraversalSegment(path) ||
    shouldSkipZipSourcePath(path)
  ) {
    return null
  }
  return path
}

export const computeZipStripPrefix = (rawPaths: string[]): string | null => {
  const kept = rawPaths
    .map(normalizeSlashes)
    .filter((path) => !isZipJunkPath(path))
    .filter((path) => path !== '' && !path.endsWith('/'))

  if (kept.length === 0) {
    return null
  }

  return findSingleRootFolderPrefix(kept)
}

export type FunctionZipSourceFile = {
  path: string
  content: string
}

export const loadFunctionZipSourceFiles = async (
  archiveData: ArrayBuffer
): Promise<FunctionZipSourceFile[]> => {
  if (archiveData.byteLength > MAX_ZIP_DOWNLOAD_BYTES) {
    return []
  }

  const zip = await JSZip.loadAsync(archiveData)
  const zipObjects = Object.values(zip.files).filter((item) => !item.dir)

  if (zipObjects.length > MAX_ZIP_SOURCE_ENTRIES) {
    return []
  }

  const rawPaths = zipObjects.map((item) => item.name)
  const stripPrefix = computeZipStripPrefix(rawPaths)
  const loadedFiles: FunctionZipSourceFile[] = []
  let totalUncompressedBytes = 0

  for (const fileObject of zipObjects) {
    const logicalPath = normalizeZipSourceEntryPath(
      fileObject.name,
      stripPrefix
    )
    if (logicalPath === null || !isFunctionSourceTextFilePath(logicalPath)) {
      continue
    }

    try {
      const binary = await fileObject.async('uint8array')
      if (binary.byteLength > MAX_ZIP_SOURCE_FILE_BYTES) {
        continue
      }
      if (
        totalUncompressedBytes + binary.byteLength >
        MAX_ZIP_UNCOMPRESSED_BYTES
      ) {
        break
      }

      const content = new TextDecoder('utf-8', { fatal: false }).decode(binary)
      if (content.trim()) {
        loadedFiles.push({ path: logicalPath, content })
        totalUncompressedBytes += binary.byteLength
      }
    } catch {
      continue
    }
  }

  return loadedFiles.sort((a, b) => a.path.localeCompare(b.path))
}

export const DEFAULT_MAX_PROMPT_CHARS = 120_000

export type TruncateZipSourceFilesResult = {
  files: FunctionZipSourceFile[]
  truncated: boolean
  omittedCount: number
}

export const truncateZipSourceFilesForPrompt = (
  files: FunctionZipSourceFile[],
  maxChars: number = DEFAULT_MAX_PROMPT_CHARS
): TruncateZipSourceFilesResult => {
  const selected: FunctionZipSourceFile[] = []
  let usedChars = 0

  for (const file of files) {
    const block = `\`\`\`\n// ${file.path}\n${file.content}\n\`\`\`\n`
    if (usedChars + block.length > maxChars) {
      return {
        files: selected,
        truncated: true,
        omittedCount: files.length - selected.length,
      }
    }
    selected.push(file)
    usedChars += block.length
  }

  return {
    files: selected,
    truncated: false,
    omittedCount: 0,
  }
}
