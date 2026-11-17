import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, createVerify } from 'node:crypto'
import { mintAccessToken } from './auth.mjs'

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' })
const keyJson = (extra = {}) =>
  JSON.stringify({
    client_email: 'deployer@project.iam.gserviceaccount.com',
    private_key: pem,
    token_uri: 'https://token.example/oauth',
    ...extra,
  })
const NOW = 1_700_000_000_000

const stubFetch = (response) => {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url, init })
    return response
  }
  return { calls, fetchImpl }
}

test('mintAccessToken posts a signed jwt-bearer grant and returns the access token', async () => {
  const { calls, fetchImpl } = stubFetch(
    new Response(JSON.stringify({ access_token: 'tok-1' }), { status: 200 })
  )
  const token = await mintAccessToken(keyJson(), { fetchImpl, now: () => NOW })
  assert.equal(token, 'tok-1')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'https://token.example/oauth')
  assert.equal(calls[0].init.method, 'POST')
  assert.equal(calls[0].init.headers['Content-Type'], 'application/x-www-form-urlencoded')

  const form = new URLSearchParams(calls[0].init.body)
  assert.equal(form.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  const [header, claims, signature] = form.get('assertion').split('.')
  assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url')), { alg: 'RS256', typ: 'JWT' })
  assert.deepEqual(JSON.parse(Buffer.from(claims, 'base64url')), {
    iss: 'deployer@project.iam.gserviceaccount.com',
    scope:
      'https://www.googleapis.com/auth/firebase.hosting https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://token.example/oauth',
    iat: 1_700_000_000,
    exp: 1_700_003_600,
  })
  assert.ok(!form.get('assertion').includes('='))
  const verifier = createVerify('RSA-SHA256').update(`${header}.${claims}`)
  assert.ok(verifier.verify(publicKey, Buffer.from(signature, 'base64url')))
})

test('mintAccessToken defaults the token uri', async () => {
  const { calls, fetchImpl } = stubFetch(
    new Response(JSON.stringify({ access_token: 't' }), { status: 200 })
  )
  const key = JSON.parse(keyJson())
  delete key.token_uri
  await mintAccessToken(JSON.stringify(key), { fetchImpl, now: () => NOW })
  assert.equal(calls[0].url, 'https://oauth2.googleapis.com/token')
})

test('mintAccessToken names a missing field and leaks no key material', async () => {
  const key = JSON.parse(keyJson())
  delete key.private_key
  await assert.rejects(
    mintAccessToken(JSON.stringify(key), { fetchImpl: async () => assert.fail('no fetch') }),
    (error) => /private_key/.test(error.message) && !error.message.includes('BEGIN')
  )
})

test('mintAccessToken rejects invalid JSON without echoing it', async () => {
  await assert.rejects(
    mintAccessToken('{"private_key": "secret-material"', { fetchImpl: async () => assert.fail('no fetch') }),
    (error) => /not valid JSON/.test(error.message) && !error.message.includes('secret-material')
  )
})

test('mintAccessToken reports status and error on a 400 without the assertion', async () => {
  const { calls, fetchImpl } = stubFetch(
    new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Bad signature' }), {
      status: 400,
    })
  )
  await assert.rejects(
    mintAccessToken(keyJson(), { fetchImpl, now: () => NOW }),
    (error) => {
      const assertion = new URLSearchParams(calls[0].init.body).get('assertion')
      return (
        /400/.test(error.message) &&
        /invalid_grant/.test(error.message) &&
        /Bad signature/.test(error.message) &&
        !error.message.includes(assertion) &&
        !error.message.includes('BEGIN')
      )
    }
  )
})
