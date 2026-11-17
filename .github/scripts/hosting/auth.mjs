import { createSign } from 'node:crypto'

const SCOPE =
  'https://www.googleapis.com/auth/firebase.hosting https://www.googleapis.com/auth/cloud-platform'
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token'

const base64url = (input) => Buffer.from(input).toString('base64url')

const parseKey = (serviceAccountJson) => {
  let key
  try {
    key = JSON.parse(serviceAccountJson)
  } catch {
    throw new Error('Service account key is not valid JSON')
  }
  if (key === null || typeof key !== 'object') {
    throw new Error('Service account key is not a JSON object')
  }
  for (const field of ['client_email', 'private_key']) {
    if (typeof key[field] !== 'string' || key[field] === '') {
      throw new Error(`Service account key is missing ${field}`)
    }
  }
  return key
}

// Exchanges a service account key for a short-lived access token (RS256 JWT bearer grant).
// https://developers.google.com/identity/protocols/oauth2/service-account#httprest
export const mintAccessToken = async (
  serviceAccountJson,
  { fetchImpl = fetch, now = Date.now } = {}
) => {
  const key = parseKey(serviceAccountJson)
  const tokenUri = key.token_uri || DEFAULT_TOKEN_URI
  const iat = Math.floor(now() / 1000)
  const signingInput = [
    base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    base64url(
      JSON.stringify({
        iss: key.client_email,
        scope: SCOPE,
        aud: tokenUri,
        iat,
        exp: iat + 3600,
      })
    ),
  ].join('.')
  let signature
  try {
    signature = createSign('RSA-SHA256').update(signingInput).sign(key.private_key)
  } catch {
    throw new Error('Service account private_key could not be used to sign')
  }
  const assertion = `${signingInput}.${base64url(signature)}`

  const res = await fetchImpl(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${assertion}`,
  })
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    // keep the empty object, the status check below reports the failure
  }
  if (!res.ok) {
    const detail = [data.error, data.error_description].filter(Boolean).join(': ')
    throw new Error(
      `Token request failed: ${res.status}${detail ? ` ${detail}` : ''}`
    )
  }
  if (typeof data.access_token !== 'string' || data.access_token === '') {
    throw new Error('Token response has no access_token')
  }
  return data.access_token
}
