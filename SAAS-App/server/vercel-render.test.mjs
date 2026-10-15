import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { handleRender } from './vercel-render.mjs'
import { createHmac } from 'node:crypto'

const receipt = userId => createHmac('sha256', 'sandbox-test-only')
  .update(JSON.stringify([userId, 'render-123'])).digest('base64url')

const originalFetch = globalThis.fetch
const originalEnv = { ...process.env }
afterEach(() => { globalThis.fetch = originalFetch; process.env = { ...originalEnv } })
const configure = () => Object.assign(process.env, {
  VITE_APPWRITE_ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
  VITE_APPWRITE_PROJECT_ID: 'test-project', VITE_APPWRITE_DATABASE_ID: 'xora',
  VITE_APPWRITE_PROJECTS_COLLECTION_ID: 'projects', SHOTSTACK_API_KEY: 'sandbox-test-only'
})
const request = (path, method = 'POST', body = { title: 'Demo', description: 'A short script.' }) => new Request(`https://example.com/api/render/${path}`, {
  method, headers: { Authorization: 'Bearer user-session', 'Content-Type': 'application/json' },
  ...(method === 'POST' ? { body: JSON.stringify(body) } : {})
})

test('anonymous requests never reach Appwrite or Shotstack', async () => {
  globalThis.fetch = () => { throw new Error('Network must not be called') }
  const result = await handleRender(new Request('https://example.com/api/render/text', { method: 'POST' }))
  assert.equal(result.status, 401)
})

test('expired sessions never reach Shotstack', async () => {
  configure()
  let calls = 0
  globalThis.fetch = async () => { calls++; return new Response('', { status: 401 }) }
  assert.equal((await handleRender(request('text'))).status, 401)
  assert.equal(calls, 1)
})

test('authenticated text rendering forwards the key only to Shotstack', async () => {
  configure()
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options })
    if (String(url).endsWith('/account')) return Response.json({ $id: 'owner' })
    assert.equal(String(url), 'https://api.shotstack.io/edit/stage/render')
    assert.equal(options.headers['x-api-key'], 'sandbox-test-only')
    return Response.json({ response: { id: 'render-123' } })
  }
  const result = await handleRender(request('text'))
  assert.equal(result.status, 200)
  assert.deepEqual(await result.json(), { renderId: 'render-123', pollToken: receipt('owner') })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].options.headers['X-Appwrite-JWT'], 'user-session')
  assert.equal(calls[0].options.headers['x-api-key'], undefined)
})

test('a user cannot poll another user’s render', async () => {
  configure()
  let calls = 0
  globalThis.fetch = async (url) => {
    calls++
    if (String(url).endsWith('/account')) return Response.json({ $id: 'owner' })
    throw new Error('Must not reach the provider')
  }
  const req = request('status?id=render-123', 'GET')
  req.headers.set('X-Render-Receipt', receipt('someone-else'))
  assert.equal((await handleRender(req)).status, 404)
  assert.equal(calls, 1)
})

test('owned render status can be polled', async () => {
  configure()
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/account')) return Response.json({ $id: 'owner' })
    return Response.json({ response: { status: 'done', url: 'https://cdn.example.com/demo.mp4' } })
  }
  const req = request('status?id=render-123', 'GET')
  req.headers.set('X-Render-Receipt', receipt('owner'))
  const result = await handleRender(req)
  assert.equal(result.status, 200)
  assert.deepEqual(await result.json(), { status: 'done', url: 'https://cdn.example.com/demo.mp4' })
})

