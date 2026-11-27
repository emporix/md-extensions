// Firebase Hosting REST API v1beta1
// https://firebase.google.com/docs/hosting/api-deploy
const API = 'https://firebasehosting.googleapis.com/v1beta1'

const request = async (ctx, url, { method = 'GET', body, contentType, allow404 } = {}) => {
  const headers = { Authorization: `Bearer ${ctx.token}` }
  let payload = body
  if (body !== undefined && contentType === undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  } else if (contentType) {
    headers['Content-Type'] = contentType
  }
  const res = await globalThis.fetch(url, { method, headers, body: payload })
  if (allow404 && res.status === 404) return null
  if (!res.ok) {
    throw new Error(`${method} ${url} failed: ${res.status} ${await res.text()}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

// GET sites/SITE/channels/CHANNEL -> Channel.release.version.name
// Returns null only for a channel that exists but never had a release. Anything
// else that is unreadable throws, so a deploy never starts from a wrongly empty site.
export const getLiveVersion = async (ctx, channel = 'live') => {
  const data = await request(ctx, `${API}/sites/${ctx.site}/channels/${channel}`)
  if (data.release === undefined || data.release === null) return null
  const name = data.release.version?.name
  if (typeof name !== 'string' || name === '') {
    throw new Error(
      `Unexpected response shape for channel ${channel} of site ${ctx.site}: release has no version name`
    )
  }
  return name
}

// GET {version}/files?pageSize&pageToken -> files[{path,hash}], nextPageToken
export const listFiles = async (ctx, version) => {
  const files = {}
  let pageToken
  do {
    const params = new URLSearchParams({ pageSize: '1000' })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await request(ctx, `${API}/${version}/files?${params}`)
    for (const f of data.files ?? []) {
      if (typeof f.path !== 'string' || !f.path.startsWith('/')) {
        throw new Error(
          `Unexpected response shape for files of ${version}: path ${JSON.stringify(f.path)} does not start with /`
        )
      }
      files[f.path] = f.hash
    }
    pageToken = data.nextPageToken
  } while (pageToken)
  return files
}

// POST sites/SITE/versions {config} -> {name}
export const createVersion = async (ctx, config) => {
  const data = await request(ctx, `${API}/sites/${ctx.site}/versions`, {
    method: 'POST',
    body: { config },
  })
  return data.name
}

// POST {version}:populateFiles {files} -> {uploadUrl, uploadRequiredHashes}
export const populateFiles = async (ctx, version, files) => {
  const data = await request(ctx, `${API}/${version}:populateFiles`, {
    method: 'POST',
    body: { files },
  })
  return { uploadUrl: data.uploadUrl, required: data.uploadRequiredHashes ?? [] }
}

// POST {uploadUrl}/{hash}, application/octet-stream, gzipped bytes
export const uploadFile = async (ctx, uploadUrl, hash, gzipped) => {
  await request(ctx, `${uploadUrl}/${hash}`, {
    method: 'POST',
    body: gzipped,
    contentType: 'application/octet-stream',
  })
}

// PATCH {version}?update_mask=status {status: FINALIZED}
export const finalizeVersion = async (ctx, version) => {
  await request(ctx, `${API}/${version}?update_mask=status`, {
    method: 'PATCH',
    body: { status: 'FINALIZED' },
  })
}

// Hosting deletes an expired channel only some time after its expireTime and rejects
// releases to it until then ("channel expired").
const hasExpired = ({ expireTime }) => Date.parse(expireTime) <= Date.now()

// GET channel, then PATCH ?updateMask=ttl {ttl} when it exists, else
// POST sites/SITE/channels?channelId=ID {ttl}; returns Channel.url. Like
// `firebase hosting:channel:deploy --expires`, every deploy keeps the channel for ttl from now.
// An expired channel that rejects the PATCH is deleted and created again.
export const ensureChannel = async (ctx, channel, ttl) => {
  const url = `${API}/sites/${ctx.site}/channels/${channel}`
  const existing = await request(ctx, url, { allow404: true })
  if (existing) {
    if (!ttl) return existing.url
    try {
      const updated = await request(ctx, `${url}?updateMask=ttl`, {
        method: 'PATCH',
        body: { ttl },
      })
      console.log(`Channel ${channel} expires at ${updated.expireTime}`)
      return existing.url
    } catch (error) {
      if (!hasExpired(existing)) throw error
      console.log(
        `Channel ${channel} expired at ${existing.expireTime}, creating it again. ${error.message}`
      )
      await request(ctx, url, { method: 'DELETE', allow404: true })
    }
  }
  const created = await request(
    ctx,
    `${API}/sites/${ctx.site}/channels?channelId=${encodeURIComponent(channel)}`,
    { method: 'POST', body: ttl ? { ttl } : {} }
  )
  console.log(`Channel ${channel} expires at ${created.expireTime}`)
  return created.url
}

// POST sites/SITE/channels/CHANNEL/releases?versionName=...
export const release = async (ctx, channel, version) => {
  await request(
    ctx,
    `${API}/sites/${ctx.site}/channels/${channel}/releases?versionName=${encodeURIComponent(version)}`,
    { method: 'POST' }
  )
}
