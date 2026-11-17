import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import {
  hashDir,
  mergeManifest,
  slugsOf,
  buildServingConfig,
  planUploads,
} from './manifest.mjs'

test('mergeManifest replaces only the slug', () => {
  const live = { '/labels/a.js': 'h1', '/labels/old.js': 'h2', '/orders/a.js': 'h3' }
  assert.deepEqual(mergeManifest(live, 'labels', { '/a.js': 'h9' }), {
    '/orders/a.js': 'h3',
    '/labels/a.js': 'h9',
  })
})

test('mergeManifest works on an empty site', () => {
  assert.deepEqual(mergeManifest({}, 'labels', { '/a.js': 'h9' }), {
    '/labels/a.js': 'h9',
  })
})

test('mergeManifest does not touch a slug with the same prefix', () => {
  const live = { '/customer-groups/a.js': 'h1' }
  assert.deepEqual(mergeManifest(live, 'customer', { '/a.js': 'h2' }), {
    '/customer-groups/a.js': 'h1',
    '/customer/a.js': 'h2',
  })
})

test('slugsOf returns sorted first path segments', () => {
  assert.deepEqual(
    slugsOf({ '/orders/a.js': 'h', '/labels/b/c.js': 'h', '/labels/a.js': 'h' }),
    ['labels', 'orders']
  )
})

test('buildServingConfig adds one rewrite per slug and the CORS header', () => {
  const c = buildServingConfig(['labels', 'orders'])
  assert.deepEqual(
    c.rewrites.map((r) => [r.glob, r.path]),
    [
      ['/labels/**', '/labels/index.html'],
      ['/orders/**', '/orders/index.html'],
    ]
  )
  assert.equal(c.headers[0].glob, '**')
  assert.equal(c.headers[0].headers['Access-Control-Allow-Origin'], '*')
})

test('planUploads returns the gzipped buffers of required hashes', () => {
  const gzipped = Buffer.from('x')
  assert.deepEqual(planUploads(['h1'], { '/a': { hash: 'h1', gzipped } }), [gzipped])
})

test('planUploads throws when a required hash is not local', () => {
  assert.throws(() => planUploads(['foreign'], {}), /foreign/)
})

test('hashDir hashes the gzipped content', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hash-'))
  try {
    await mkdir(join(dir, 'assets'))
    await writeFile(join(dir, 'assets', 'a.js'), 'hello')
    const out = await hashDir(dir)
    const expected = createHash('sha256').update(gzipSync('hello')).digest('hex')
    assert.deepEqual(Object.keys(out), ['/assets/a.js'])
    assert.equal(out['/assets/a.js'].hash, expected)
    assert.ok(Buffer.isBuffer(out['/assets/a.js'].gzipped))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('hashDir skips dotfiles and dot directories', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'hash-dot-'))
  try {
    await mkdir(join(dir, '.git'))
    await mkdir(join(dir, 'assets'))
    await writeFile(join(dir, '.git', 'config'), 'x')
    await writeFile(join(dir, '.DS_Store'), 'x')
    await writeFile(join(dir, 'assets', '.hidden'), 'x')
    await writeFile(join(dir, 'assets', 'a.js'), 'x')
    assert.deepEqual(Object.keys(await hashDir(dir)), ['/assets/a.js'])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
