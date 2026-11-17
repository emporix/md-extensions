// Builds one remote for the shared Hosting site: every file lands flat in dist/
// (no assets/ folder) and every URL starts with /<remote>/, so the remote is served
// from https://<site>/<remote>/remoteEntry.js.
//
// The remote's own vite.config and build scripts stay as they are: a build with
// this base breaks when it is served from a site root (the old per-remote sites,
// local preview), so the base is set only here.
//
// Run from the remote's folder through stdin, so that 'vite' resolves from the
// remote's node_modules:
//   REMOTE=labels MODE=dev node --input-type=module - < build-remote.mjs
import { build } from 'vite'

const { REMOTE, MODE } = process.env
if (!/^[a-z0-9-]+$/.test(REMOTE ?? '')) {
  throw new Error(`REMOTE must be a remote folder name, got "${REMOTE ?? ''}"`)
}
if (!MODE) throw new Error('MODE is not set (dev, stage or prod)')

await build({ mode: MODE, base: `/${REMOTE}/`, build: { assetsDir: '' } })
