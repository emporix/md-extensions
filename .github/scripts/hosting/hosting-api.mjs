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
export const getLiveVersion = async (ctx, channel = 'live') => {
  const data = await request(ctx, `${API}/sites/${ctx.site}/channels/${channel}`, {
    allow404: true,
  })
  return data?.release?.version?.name ?? null
}

// GET {version}/files?pageSize&pageToken -> files[{path,hash}], nextPageToken
export const listFiles = async (ctx, version) => {
  const files = {}
  let pageToken
  do {
    const params = new URLSearchParams({ pageSize: '1000' })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await request(ctx, `${API}/${version}/files?${params}`)
    for (const f of data.files ?? []) files[f.path] = f.hash
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

// GET channel, else POST sites/SITE/channels?channelId=ID {ttl}; returns Channel.url
export const ensureChannel = async (ctx, channel, ttl) => {
  const existing = await request(ctx, `${API}/sites/${ctx.site}/channels/${channel}`, {
    allow404: true,
  })
  if (existing) return existing.url
  const created = await request(
    ctx,
    `${API}/sites/${ctx.site}/channels?channelId=${encodeURIComponent(channel)}`,
    { method: 'POST', body: ttl ? { ttl } : {} }
  )
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
