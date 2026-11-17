import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'

const walk = async (root, rel = '') => {
  const entries = await readdir(join(root, rel), { withFileTypes: true })
  const nested = await Promise.all(
    entries
      .filter((e) => !e.name.startsWith('.'))
      .map((e) => {
        const next = `${rel}/${e.name}`
        return e.isDirectory() ? walk(root, next) : [next]
      })
  )
  return nested.flat()
}

export const hashDir = async (dir) => {
  const result = {}
  for (const path of (await walk(dir)).sort()) {
    const gzipped = gzipSync(await readFile(join(dir, path)))
    result[path] = {
      hash: createHash('sha256').update(gzipped).digest('hex'),
      gzipped,
    }
  }
  return result
}

export const mergeManifest = (live, slug, next) => {
  const prefix = `/${slug}/`
  const merged = {}
  for (const [path, hash] of Object.entries(live)) {
    if (!path.startsWith(prefix)) merged[path] = hash
  }
  for (const [path, hash] of Object.entries(next)) {
    merged[`/${slug}${path}`] = hash
  }
  return merged
}

export const slugsOf = (files) => {
  const slugs = new Set()
  for (const path of Object.keys(files)) {
    const [, slug, ...rest] = path.split('/')
    if (slug && rest.length > 0) slugs.add(slug)
  }
  return [...slugs].sort()
}

export const buildServingConfig = (slugs) => ({
  headers: [{ glob: '**', headers: { 'Access-Control-Allow-Origin': '*' } }],
  rewrites: slugs.map((slug) => ({
    glob: `/${slug}/**`,
    path: `/${slug}/index.html`,
  })),
})

export const planUploads = (required, local) => {
  const byHash = new Map(Object.values(local).map((f) => [f.hash, f.gzipped]))
  return required.map((hash) => {
    const gzipped = byHash.get(hash)
    if (!gzipped) throw new Error(`Hosting requires unknown file hash ${hash}`)
    return gzipped
  })
}
