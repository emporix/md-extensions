import { parseArgs } from 'node:util'
import { access, appendFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as hostingApi from './hosting-api.mjs'
import { mintAccessToken } from './auth.mjs'
import {
  hashDir,
  mergeManifest,
  slugsOf,
  buildServingConfig,
  planUploads,
} from './manifest.mjs'

const POPULATE_BATCH = 1000

const pause = (ms = 1000 + Math.random() * 4000) =>
  new Promise((resolve) => setTimeout(resolve, ms))

const buildVersion = async (api, ctx, liveVersion, slug, local) => {
  const liveFiles = liveVersion ? await api.listFiles(ctx, liveVersion) : {}
  const next = Object.fromEntries(Object.entries(local).map(([p, f]) => [p, f.hash]))
  const merged = mergeManifest(liveFiles, slug, next)
  const version = await api.createVersion(ctx, buildServingConfig(slugsOf(merged)))

  const entries = Object.entries(merged)
  const required = []
  let uploadUrl
  for (let i = 0; i < entries.length; i += POPULATE_BATCH) {
    const res = await api.populateFiles(
      ctx,
      version,
      Object.fromEntries(entries.slice(i, i + POPULATE_BATCH))
    )
    uploadUrl = res.uploadUrl
    required.push(...res.required)
  }
  const buffers = planUploads(required, local)
  for (const [i, gzipped] of buffers.entries()) {
    await api.uploadFile(ctx, uploadUrl, required[i], gzipped)
  }
  await api.finalizeVersion(ctx, version)
  return version
}

// Every local file of this slug is live with the same hash.
const isDeployed = (liveFiles, slug, local) =>
  Object.entries(local).every(([path, f]) => liveFiles[`/${slug}${path}`] === f.hash)

export const releaseWithRetry = async (
  api,
  ctx,
  { slug, local, channel, attempts = 5, sleep = pause, settleMs = 10000 }
) => {
  let overwritten = false
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const before = await api.getLiveVersion(ctx, 'live')
    const version = await buildVersion(api, ctx, before, slug, local)
    // A preview channel is only ours, so a concurrent live deploy does not matter.
    const raced = !channel && (await api.getLiveVersion(ctx, 'live')) !== before
    if (!raced) {
      await api.release(ctx, channel ?? 'live', version)
      if (channel) return version
      // The re-check above leaves a gap before the release, so a concurrent deploy
      // can still win. Verify that our files survived once the dust settles.
      await sleep(settleMs)
      const after = await api.getLiveVersion(ctx, 'live')
      if (after === version) return version
      // No live release at all means our release is not confirmed, try again.
      if (after && isDeployed(await api.listFiles(ctx, after), slug, local)) return version
      overwritten = true
    } else {
      overwritten = false
    }
    if (attempt < attempts) await sleep()
  }
  throw new Error(
    overwritten
      ? `${slug} was overwritten by a concurrent deploy after ${attempts} attempts, re-run the workflow`
      : `The live version kept changing, gave up after ${attempts} attempts`
  )
}

const validateDir = async (dir) => {
  const info = await stat(dir).catch(() => null)
  if (!info?.isDirectory()) throw new Error(`Directory ${dir} does not exist`)
  await access(join(dir, 'assets', 'remoteEntry.js')).catch(() => {
    throw new Error(`${dir} has no assets/remoteEntry.js, was the remote built?`)
  })
}

export const run = async (
  argv,
  env = process.env,
  api = hostingApi,
  options = {},
  mint = mintAccessToken
) => {
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        site: { type: 'string' },
        slug: { type: 'string' },
        dir: { type: 'string' },
        channel: { type: 'string' },
        ttl: { type: 'string', default: '432000s' },
      },
    })
    const { site, slug, dir, channel, ttl } = values
    if (!site || !slug || !dir) throw new Error('--site, --slug and --dir are required')
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(`--slug ${slug} must match ^[a-z0-9-]+$`)
    }
    if (!env.GOOGLE_OAUTH_ACCESS_TOKEN && !env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('Set GOOGLE_OAUTH_ACCESS_TOKEN or FIREBASE_SERVICE_ACCOUNT')
    }
    await validateDir(dir)

    const token =
      env.GOOGLE_OAUTH_ACCESS_TOKEN || (await mint(env.FIREBASE_SERVICE_ACCOUNT))
    const ctx = { token, site }
    const local = await hashDir(dir)
    let baseUrl = `https://${site}.web.app`
    if (channel) baseUrl = (await api.ensureChannel(ctx, channel, ttl)).replace(/\/$/, '')
    await releaseWithRetry(api, ctx, { slug, local, channel, ...options })

    const url = `${baseUrl}/${slug}/`
    console.log(`Deployed ${slug} to ${url}`)
    if (env.GITHUB_OUTPUT) await appendFile(env.GITHUB_OUTPUT, `url=${url}\n`)
    return 0
  } catch (error) {
    console.error(error.message)
    return 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await run(process.argv.slice(2))
}
