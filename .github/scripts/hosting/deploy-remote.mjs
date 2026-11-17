import { parseArgs } from 'node:util'
import { access, appendFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as hostingApi from './hosting-api.mjs'
import {
  hashDir,
  mergeManifest,
  slugsOf,
  buildServingConfig,
  planUploads,
} from './manifest.mjs'

const POPULATE_BATCH = 1000

const randomPause = () =>
  new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 4000))

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

export const releaseWithRetry = async (
  api,
  ctx,
  { slug, local, channel, attempts = 5, sleep = randomPause }
) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const before = await api.getLiveVersion(ctx, 'live')
    const version = await buildVersion(api, ctx, before, slug, local)
    // A preview channel is only ours, so a concurrent live deploy does not matter.
    const raced = !channel && (await api.getLiveVersion(ctx, 'live')) !== before
    if (!raced) {
      await api.release(ctx, channel ?? 'live', version)
      return version
    }
    if (attempt < attempts) await sleep()
  }
  throw new Error(`The live version kept changing, gave up after ${attempts} attempts`)
}

const validateDir = async (dir) => {
  const info = await stat(dir).catch(() => null)
  if (!info?.isDirectory()) throw new Error(`Directory ${dir} does not exist`)
  await access(join(dir, 'assets', 'remoteEntry.js')).catch(() => {
    throw new Error(`${dir} has no assets/remoteEntry.js, was the remote built?`)
  })
}

export const run = async (argv, env = process.env, api = hostingApi) => {
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
    if (!env.GOOGLE_OAUTH_ACCESS_TOKEN) throw new Error('GOOGLE_OAUTH_ACCESS_TOKEN is not set')
    await validateDir(dir)

    const ctx = { token: env.GOOGLE_OAUTH_ACCESS_TOKEN, site }
    const local = await hashDir(dir)
    let baseUrl = `https://${site}.web.app`
    if (channel) baseUrl = (await api.ensureChannel(ctx, channel, ttl)).replace(/\/$/, '')
    await releaseWithRetry(api, ctx, { slug, local, channel })

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
