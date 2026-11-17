import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { listFiles, getLiveVersion } from './hosting-api.mjs'
import { releaseWithRetry, run } from './deploy-remote.mjs'

const ctx = { token: 't', site: 's' }
const local = { '/index.html': { hash: 'hl', gzipped: Buffer.from('l') } }

const fakeApi = (lives, filesByVersion) => {
  const calls = { createVersion: [], release: [], uploads: [], populate: [], listed: [], live: 0 }
  let released = null
  let n = 0
  const queue = [...lives]
  return {
    calls,
    getLiveVersion: async () => {
      calls.live++
      return queue.shift() ?? released
    },
    listFiles: async (_c, v) => {
      calls.listed.push(v)
      return filesByVersion[v] ?? {}
    },
    createVersion: async (_c, config) => {
      calls.createVersion.push(config)
      return `sites/s/versions/new${++n}`
    },
    populateFiles: async (_c, v, files) => {
      calls.populate.push(files)
      return { uploadUrl: 'u', required: ['hl'] }
    },
    uploadFile: async (_c, _u, hash) => calls.uploads.push(hash),
    finalizeVersion: async () => {},
    release: async (_c, channel, v) => {
      released = v
      calls.release.push([channel, v])
    },
  }
}
const noSleep = async () => {}
const runQuiet = async (...args) => {
  const { error, log } = console
  console.error = () => {}
  console.log = () => {}
  try {
    return await run(...args)
  } finally {
    console.error = error
    console.log = log
  }
}
const recordingSleep = () => {
  const waits = []
  const sleep = async (ms) => {
    waits.push(ms)
  }
  return { waits, sleep }
}

test('listFiles follows nextPageToken', async () => {
  const urls = []
  const orig = globalThis.fetch
  globalThis.fetch = async (url) => {
    urls.push(String(url))
    const second = String(url).includes('pageToken=p2')
    return new Response(
      JSON.stringify(
        second
          ? { files: [{ path: '/b', hash: 'hb' }] }
          : { files: [{ path: '/a', hash: 'ha' }], nextPageToken: 'p2' }
      ),
      { status: 200 }
    )
  }
  try {
    assert.deepEqual(await listFiles(ctx, 'sites/s/versions/v1'), { '/a': 'ha', '/b': 'hb' })
    assert.equal(urls.length, 2)
  } finally {
    globalThis.fetch = orig
  }
})

const withFetch = async (respond, fn) => {
  const orig = globalThis.fetch
  globalThis.fetch = async () => respond()
  try {
    return await fn()
  } finally {
    globalThis.fetch = orig
  }
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status })

test('getLiveVersion returns null for a channel without release', async () => {
  await withFetch(() => json({ name: 'sites/s/channels/live' }), async () => {
    assert.equal(await getLiveVersion(ctx), null)
  })
})

test('getLiveVersion rejects on 404 naming the site', async () => {
  await withFetch(() => json({}, 404), async () => {
    await assert.rejects(getLiveVersion({ token: 't', site: 'wrong-site' }), /wrong-site/)
  })
})

test('getLiveVersion rejects when the release has no readable version name', async () => {
  await withFetch(() => json({ release: { name: 'r' } }), async () => {
    await assert.rejects(getLiveVersion(ctx), /Unexpected response shape for channel live/)
  })
})

test('getLiveVersion returns the version name', async () => {
  await withFetch(
    () => json({ release: { version: { name: 'sites/s/versions/v9' } } }),
    async () => assert.equal(await getLiveVersion(ctx), 'sites/s/versions/v9')
  )
})

test('releaseWithRetry propagates a failing getLiveVersion without side effects', async () => {
  const api = fakeApi([], {})
  api.getLiveVersion = async () => {
    throw new Error('boom')
  }
  await assert.rejects(releaseWithRetry(api, ctx, { slug: 'labels', local, sleep: noSleep }), /boom/)
  assert.equal(api.calls.createVersion.length, 0)
  assert.equal(api.calls.release.length, 0)
})

test('releaseWithRetry rebuilds when live changed', async () => {
  const api = fakeApi(['v1', 'v2', 'v2', 'v2'], {
    v1: { '/orders/a.js': 'h1' },
    v2: { '/orders/a.js': 'h1', '/units/a.js': 'h2' },
  })
  await releaseWithRetry(api, ctx, { slug: 'labels', local, sleep: noSleep })
  assert.equal(api.calls.createVersion.length, 2)
  assert.equal(api.calls.release.length, 1)
  assert.deepEqual(Object.keys(api.calls.populate[1]).sort(), [
    '/labels/index.html',
    '/orders/a.js',
    '/units/a.js',
  ])
  assert.deepEqual(api.calls.createVersion[1].rewrites.map((r) => r.glob), [
    '/labels/**',
    '/orders/**',
    '/units/**',
  ])
})

test('releaseWithRetry gives up after attempts', async () => {
  const lives = Array.from({ length: 20 }, (_, i) => `v${i}`)
  const api = fakeApi(lives, {})
  await assert.rejects(
    releaseWithRetry(api, ctx, { slug: 'labels', local, attempts: 3, sleep: noSleep }),
    /live version kept changing/
  )
  assert.equal(api.calls.release.length, 0)
})

test('releaseWithRetry on a preview channel skips the second read and releases to it', async () => {
  const api = fakeApi(['v1'], {})
  await releaseWithRetry(api, ctx, { slug: 'labels', local, channel: 'pr-1', sleep: noSleep })
  assert.equal(api.calls.release.length, 1)
  assert.equal(api.calls.release[0][0], 'pr-1')
})

test('releaseWithRetry deploys to an empty site', async () => {
  const api = fakeApi([null, null], {})
  await releaseWithRetry(api, ctx, { slug: 'labels', local, sleep: noSleep })
  assert.deepEqual(Object.keys(api.calls.populate[0]), ['/labels/index.html'])
  assert.deepEqual(api.calls.uploads, ['hl'])
})

const withTempDir = async (fn) => {
  const dir = await mkdtemp(join(tmpdir(), 'dr-'))
  try {
    return await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

test('cli fails without remoteEntry.js and makes no fetch call', async () => {
  await withTempDir(async (dir) => {
    await writeFile(join(dir, 'index.html'), 'x')
    const orig = globalThis.fetch
    let called = 0
    globalThis.fetch = async () => {
      called++
      return new Response('{}')
    }
    try {
      const code = await runQuiet(['--site', 's', '--slug', 'labels', '--dir', dir], {
        GOOGLE_OAUTH_ACCESS_TOKEN: 't',
      })
      assert.equal(code, 1)
      assert.equal(called, 0)
    } finally {
      globalThis.fetch = orig
    }
  })
})

test('cli process exits 1 for a missing dir', () => {
  const script = join(dirname(fileURLToPath(import.meta.url)), 'deploy-remote.mjs')
  const r = spawnSync(
    process.execPath,
    [script, '--site', 's', '--slug', 'labels', '--dir', '/nonexistent-dir-xyz'],
    { env: { ...process.env, GOOGLE_OAUTH_ACCESS_TOKEN: 't' } }
  )
  assert.equal(r.status, 1)
})

test('cli deploys a valid dir and prints the remote url', async () => {
  await withTempDir(async (dir) => {
    await mkdir(join(dir, 'assets'))
    await writeFile(join(dir, 'assets', 'remoteEntry.js'), 'x')
    const out = join(dir, 'gh-output')
    const calls = []
    const orig = globalThis.fetch
    globalThis.fetch = async (url, init = {}) => {
      const u = String(url)
      calls.push(`${init.method ?? 'GET'} ${u}`)
      if (u.endsWith('/channels/live'))
        return new Response(
          JSON.stringify(
            calls.some((c) => c.includes('/releases?'))
              ? { release: { version: { name: 'sites/s/versions/n1' } } }
              : {}
          )
        )
      if (u.endsWith('/versions') ) return new Response(JSON.stringify({ name: 'sites/s/versions/n1' }))
      if (u.includes(':populateFiles'))
        return new Response(JSON.stringify({ uploadUrl: 'https://up/x', uploadRequiredHashes: [] }))
      return new Response('{}')
    }
    try {
      const code = await runQuiet(['--site', 'mysite', '--slug', 'labels', '--dir', dir], {
        GOOGLE_OAUTH_ACCESS_TOKEN: 't',
        GITHUB_OUTPUT: out,
      }, undefined, { sleep: async () => {} })
      assert.equal(code, 0)
      const { readFile } = await import('node:fs/promises')
      assert.match(await readFile(out, 'utf8'), /^url=https:\/\/mysite\.web\.app\/labels\/\n$/)
      assert.ok(calls.some((c) => c.startsWith('POST') && c.includes('/channels/live/releases?versionName=')))
    } finally {
      globalThis.fetch = orig
    }
  })
})

test('verification: live overwritten by a version without our files triggers a second attempt', async () => {
  const api = fakeApi(['v1', 'v1', 'other', 'other', 'other'], {
    v1: { '/orders/a.js': 'h1' },
    other: { '/orders/a.js': 'h1', '/units/a.js': 'h2' },
  })
  await releaseWithRetry(api, ctx, { slug: 'labels', local, sleep: noSleep })
  assert.equal(api.calls.createVersion.length, 2)
  assert.equal(api.calls.release.length, 2)
  assert.deepEqual(Object.keys(api.calls.populate[1]).sort(), [
    '/labels/index.html',
    '/orders/a.js',
    '/units/a.js',
  ])
})

test('verification: another live version that still has our files needs no second attempt', async () => {
  const api = fakeApi(['v1', 'v1', 'other'], {
    v1: {},
    other: { '/labels/index.html': 'hl', '/units/a.js': 'h2' },
  })
  await releaseWithRetry(api, ctx, { slug: 'labels', local, sleep: noSleep })
  assert.equal(api.calls.createVersion.length, 1)
  assert.equal(api.calls.release.length, 1)
})

test('verification: our own version live needs no second attempt and no listing', async () => {
  const api = fakeApi(['v1', 'v1'], { v1: {} })
  await releaseWithRetry(api, ctx, { slug: 'labels', local, sleep: noSleep })
  assert.equal(api.calls.release.length, 1)
  assert.deepEqual(api.calls.listed, ['v1'])
})

test('verification: overwritten on every attempt rejects with the overwritten message', async () => {
  const api = fakeApi(['v1', 'v1', 'o1', 'o1', 'o1', 'o2'], { v1: {}, o1: {}, o2: {} })
  await assert.rejects(
    releaseWithRetry(api, ctx, { slug: 'labels', local, attempts: 2, sleep: noSleep }),
    /labels was overwritten by a concurrent deploy.*re-run the workflow/
  )
  assert.equal(api.calls.release.length, 2)
})

test('verification: a preview channel has no settle pause and no verification read', async () => {
  const api = fakeApi(['v1'], {})
  const { waits, sleep } = recordingSleep()
  await releaseWithRetry(api, ctx, { slug: 'labels', local, channel: 'pr-1', sleep })
  assert.deepEqual(waits, [])
  assert.equal(api.calls.live, 1)
})

test('verification: settleMs defaults to 10000 and is configurable', async () => {
  const a = recordingSleep()
  await releaseWithRetry(fakeApi(['v1', 'v1'], {}), ctx, { slug: 'labels', local, sleep: a.sleep })
  assert.deepEqual(a.waits, [10000])
  const b = recordingSleep()
  await releaseWithRetry(fakeApi(['v1', 'v1'], {}), ctx, {
    slug: 'labels',
    local,
    sleep: b.sleep,
    settleMs: 123,
  })
  assert.deepEqual(b.waits, [123])
})

test('listFiles rejects a path that does not start with a slash', async () => {
  await withFetch(
    () => json({ files: [{ path: 'labels/a.js', hash: 'h' }] }),
    async () => {
      await assert.rejects(
        listFiles(ctx, 'sites/s/versions/v1'),
        /labels\/a\.js.*Unexpected response shape|Unexpected response shape.*labels\/a\.js/
      )
    }
  )
})

test('releaseWithRetry rejects without releasing when hosting requires an unknown hash', async () => {
  const api = fakeApi(['v1', 'v1'], {})
  let finalized = 0
  api.populateFiles = async () => ({ uploadUrl: 'u', required: ['foreign'] })
  api.finalizeVersion = async () => {
    finalized++
  }
  await assert.rejects(
    releaseWithRetry(api, ctx, { slug: 'labels', local, sleep: noSleep }),
    /foreign/
  )
  assert.equal(api.calls.release.length, 0)
  assert.equal(finalized, 0)
})

test('releaseWithRetry sends more than 1000 entries in batches and uploads every required hash', async () => {
  const many = {}
  for (let i = 0; i < 2300; i++) {
    many[`/f${i}.js`] = { hash: `h${i}`, gzipped: Buffer.from(String(i)) }
  }
  const api = fakeApi(['v1', 'v1'], {})
  api.populateFiles = async (_c, _v, files) => {
    api.calls.populate.push(files)
    return { uploadUrl: 'u', required: Object.values(files).slice(0, 2) }
  }
  await releaseWithRetry(api, ctx, { slug: 'labels', local: many, sleep: noSleep })
  assert.deepEqual(api.calls.populate.map((b) => Object.keys(b).length), [1000, 1000, 300])
  assert.equal(api.calls.uploads.length, 6)
  assert.equal(new Set(api.calls.uploads).size, 6)
  assert.equal(api.calls.release.length, 1)
})

test('verification: no live release at the check counts as not confirmed', async () => {
  const api = fakeApi(['v1', 'v1'], {})
  const reads = [null, null, null, 'v1']
  let i = 0
  let released = 0
  api.getLiveVersion = async () => {
    const next = reads[i++]
    return next === undefined ? 'v1' : next
  }
  api.listFiles = async (_c, v) => {
    assert.ok(v, 'listFiles must not be called with a null version')
    return { '/labels/index.html': 'hl' }
  }
  const origRelease = api.release
  api.release = async (...a) => {
    released++
    return origRelease(...a)
  }
  await releaseWithRetry(api, ctx, { slug: 'labels', local, attempts: 2, sleep: noSleep })
  assert.equal(released, 2)
})

test('cli rejects an invalid slug before any api call', async () => {
  await withTempDir(async (dir) => {
    await mkdir(join(dir, 'assets'))
    await writeFile(join(dir, 'assets', 'remoteEntry.js'), 'x')
    const orig = globalThis.fetch
    let called = 0
    globalThis.fetch = async () => {
      called++
      return new Response('{}')
    }
    try {
      const code = await runQuiet(['--site', 's', '--slug', '../Labels', '--dir', dir], {
        GOOGLE_OAUTH_ACCESS_TOKEN: 't',
      })
      assert.equal(code, 1)
      assert.equal(called, 0)
    } finally {
      globalThis.fetch = orig
    }
  })
})

test('cli mints a token from FIREBASE_SERVICE_ACCOUNT and uses it', async () => {
  await withTempDir(async (dir) => {
    await mkdir(join(dir, 'assets'))
    await writeFile(join(dir, 'assets', 'remoteEntry.js'), 'x')
    const seen = []
    const minted = []
    const api = fakeApi([null, null], {})
    api.populateFiles = async () => ({ uploadUrl: 'u', required: [] })
    for (const name of ['getLiveVersion', 'createVersion', 'populateFiles']) {
      const fn = api[name]
      api[name] = async (c, ...rest) => {
        seen.push(c.token)
        return fn(c, ...rest)
      }
    }
    const code = await runQuiet(
      ['--site', 's', '--slug', 'labels', '--dir', dir],
      { FIREBASE_SERVICE_ACCOUNT: '{"k":1}' },
      api,
      { sleep: noSleep, settleMs: 0 },
      async (json) => {
        minted.push(json)
        return 'minted-token'
      }
    )
    assert.equal(code, 0)
    assert.deepEqual(minted, ['{"k":1}'])
    assert.ok(seen.length > 0)
    assert.ok(seen.every((t) => t === 'minted-token'))
  })
})

test('cli with neither token nor service account fails without fetch', async () => {
  await withTempDir(async (dir) => {
    await mkdir(join(dir, 'assets'))
    await writeFile(join(dir, 'assets', 'remoteEntry.js'), 'x')
    const orig = globalThis.fetch
    let called = 0
    globalThis.fetch = async () => {
      called++
      return new Response('{}')
    }
    try {
      const code = await runQuiet(['--site', 's', '--slug', 'labels', '--dir', dir], {})
      assert.equal(code, 1)
      assert.equal(called, 0)
    } finally {
      globalThis.fetch = orig
    }
  })
})
