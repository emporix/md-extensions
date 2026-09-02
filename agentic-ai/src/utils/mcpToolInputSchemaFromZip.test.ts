import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import {
  getLatestDeploymentMediaId,
  sortFunctionDeploymentsByCreatedAtDesc,
} from './functionDeploymentMedia.helpers'
import { buildMcpToolInputSchemaPrompt } from './mcpToolInputSchemaPrompt.helpers'
import { formatZipSourceBlocksForPrompt } from './functionZipSourcePrompt.helpers'
import {
  MAX_ZIP_SOURCE_FILE_BYTES,
  hasZipPathTraversalSegment,
  isFunctionSourceTextFilePath,
  loadFunctionZipSourceFiles,
  normalizeZipSourceEntryPath,
  shouldSkipZipSourcePath,
  truncateZipSourceFilesForPrompt,
} from './functionZipSource.helpers'

describe('functionDeploymentMedia.helpers', () => {
  it('returns latest mediaId by createdAt', () => {
    const mediaId = getLatestDeploymentMediaId([
      {
        id: '1',
        hostingId: 'fn-1',
        createdAt: '2026-01-01T00:00:00Z',
        buildId: 'b1',
        deploymentType: 'media',
        mediaId: 'old',
      },
      {
        id: '2',
        hostingId: 'fn-1',
        createdAt: '2026-02-01T00:00:00Z',
        buildId: 'b2',
        deploymentType: 'media',
        mediaId: 'new',
      },
      {
        id: '3',
        hostingId: 'fn-1',
        createdAt: '2026-03-01T00:00:00Z',
        buildId: 'b3',
        deploymentType: 'github',
      },
    ])
    expect(mediaId).toBe('new')
  })

  it('returns null when no media deployments exist', () => {
    expect(getLatestDeploymentMediaId([])).toBeNull()
    expect(
      getLatestDeploymentMediaId([
        {
          id: '1',
          hostingId: 'fn-1',
          createdAt: '2026-01-01T00:00:00Z',
          buildId: 'b1',
          deploymentType: 'github',
        },
      ])
    ).toBeNull()
  })

  it('sorts deployments newest first', () => {
    const sorted = sortFunctionDeploymentsByCreatedAtDesc([
      {
        id: '1',
        hostingId: 'fn-1',
        createdAt: '2026-01-01T00:00:00Z',
        buildId: 'b1',
        deploymentType: 'media',
      },
      {
        id: '2',
        hostingId: 'fn-1',
        createdAt: '2026-03-01T00:00:00Z',
        buildId: 'b2',
        deploymentType: 'media',
      },
    ])
    expect(sorted[0].id).toBe('2')
  })

  it('ignores invalid createdAt when picking latest mediaId', () => {
    const mediaId = getLatestDeploymentMediaId([
      {
        id: '1',
        hostingId: 'fn-1',
        createdAt: 'not-a-date',
        buildId: 'b1',
        deploymentType: 'media',
        mediaId: 'invalid-date',
      },
      {
        id: '2',
        hostingId: 'fn-1',
        createdAt: '2026-03-01T00:00:00Z',
        buildId: 'b2',
        deploymentType: 'media',
        mediaId: 'valid',
      },
    ])
    expect(mediaId).toBe('valid')
  })
})

describe('functionZipSource.helpers', () => {
  it('skips vendor and build directories', () => {
    expect(shouldSkipZipSourcePath('node_modules/pkg/index.js')).toBe(true)
    expect(shouldSkipZipSourcePath('src/index.js')).toBe(false)
  })

  it('rejects zip paths with parent-directory segments', () => {
    expect(hasZipPathTraversalSegment('src/../secrets.js')).toBe(true)
    expect(
      normalizeZipSourceEntryPath('project/src/../secrets.js', 'project/')
    ).toBeNull()
  })

  it('throws when truncation leaves no source files for prompt', () => {
    expect(() =>
      formatZipSourceBlocksForPrompt(
        [{ path: 'large.js', content: 'x'.repeat(150_000) }],
        'Infer schema.',
        'mcp_tool_input_schema_generate_no_source'
      )
    ).toThrow('mcp_tool_input_schema_generate_no_source')
  })

  it('accepts js, typescript, and python source and project files', () => {
    expect(isFunctionSourceTextFilePath('src/index.ts')).toBe(true)
    expect(isFunctionSourceTextFilePath('src/handler.js')).toBe(true)
    expect(isFunctionSourceTextFilePath('main.py')).toBe(true)
    expect(isFunctionSourceTextFilePath('package.json')).toBe(true)
    expect(isFunctionSourceTextFilePath('requirements.txt')).toBe(true)
    expect(isFunctionSourceTextFilePath('package-lock.json')).toBe(false)
    expect(isFunctionSourceTextFilePath('readme.md')).toBe(false)
    expect(isFunctionSourceTextFilePath('src/main.go')).toBe(false)
  })

  it('normalizes zip paths and strips a single root folder', () => {
    expect(
      normalizeZipSourceEntryPath('project/src/index.js', 'project/')
    ).toBe('src/index.js')
    expect(
      normalizeZipSourceEntryPath('project/node_modules/x/index.js', 'project/')
    ).toBeNull()
  })

  it('loads only js, typescript, and python source from zip archive', async () => {
    const zip = new JSZip()
    zip.file('fn/src/handler.js', 'export const handler = () => {}')
    zip.file('fn/src/types.ts', 'export type Input = { id: string }')
    zip.file('fn/main.py', 'def handler(): pass')
    zip.file('fn/node_modules/x/index.js', 'ignored')
    zip.file('fn/readme.md', '# fn')
    zip.file('fn/main.go', 'package main')
    const buffer = await zip.generateAsync({ type: 'arraybuffer' })

    const files = await loadFunctionZipSourceFiles(buffer)
    expect(files.map((file) => file.path)).toEqual([
      'main.py',
      'src/handler.js',
      'src/types.ts',
    ])
  })

  it('skips zip entries whose declared uncompressed size exceeds the per-file cap', async () => {
    const zip = new JSZip()
    zip.file('small.js', 'export const ok = true')
    zip.file('huge.js', 'x'.repeat(MAX_ZIP_SOURCE_FILE_BYTES + 1))
    const buffer = await zip.generateAsync({ type: 'arraybuffer' })

    const files = await loadFunctionZipSourceFiles(buffer)
    expect(files.map((file) => file.path)).toEqual(['small.js'])
  })

  it('truncates files when prompt budget exceeded', () => {
    const files = [
      { path: 'a.js', content: 'a'.repeat(1000) },
      { path: 'b.js', content: 'b'.repeat(1000) },
    ]
    const result = truncateZipSourceFilesForPrompt(files, 500)
    expect(result.truncated).toBe(true)
    expect(result.files.length).toBeLessThan(files.length)
  })
})

describe('mcpToolInputSchemaPrompt.helpers', () => {
  it('builds prompt with tool context and source blocks', () => {
    const prompt = buildMcpToolInputSchemaPrompt(
      {
        toolName: 'listProducts',
        toolDescription: 'List products',
        functionId: 'fn-123',
        httpMethod: 'POST',
        argsLocation: 'body',
      },
      [{ path: 'index.js', content: 'module.exports = {}' }]
    )

    expect(prompt).toContain('Tool name: listProducts')
    expect(prompt).toContain('Cloud function ID: fn-123')
    expect(prompt).toContain('// index.js')
    expect(prompt).toContain('JSON Schema')
  })
})
