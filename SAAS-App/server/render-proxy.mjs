import http from 'node:http'
import { URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return
  const raw = fs.readFileSync(filePath, 'utf8')
  raw.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex < 0) return
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  })
}

const cwd = process.cwd()
loadEnvFile(path.join(cwd, '.env'))
loadEnvFile(path.join(cwd, '.env.local'))

const PORT = Number(process.env.RENDER_PROXY_PORT || 8787)
const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || process.env.VITE_SHOTSTACK_API_KEY || ''
const EDIT_URL = 'https://api.shotstack.io/edit/stage'

const sendJson = (res, status, data) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  })
  res.end(JSON.stringify(data))
}

const readBody = async (req) =>
  new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) reject(new Error('Payload too large'))
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const buildTimeline = (title, description, options = {}) => {
  const MAX_CHARS_PER_LINE = 52
  const MAX_SCREENS = 6
  const SCREEN_DURATION = 4.2
  const SCREEN_GAP = 0.6

  const splitDescription = (raw = '') => {
    const clean = String(raw).replace(/\s+/g, ' ').trim()
    if (!clean) return []
    return clean
      .split(/[.!?;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean)
  }

  const splitBalancedLine = (text = '', maxChars = MAX_CHARS_PER_LINE) => {
    const clean = String(text).trim()
    if (clean.length <= maxChars) return [clean]
    const words = clean.split(/\s+/)
    if (words.length <= 3) return [clean]
    const totalLen = clean.length
    const mid = totalLen / 2
    let bestIdx = 1
    let bestScore = Number.POSITIVE_INFINITY
    for (let i = 2; i < words.length - 1; i += 1) {
      const left = words.slice(0, i).join(' ')
      const right = words.slice(i).join(' ')
      const score = Math.abs(left.length - mid) + Math.abs(left.length - right.length) * 0.5
      if (left.length >= 18 && right.length >= 18 && score < bestScore) {
        bestScore = score
        bestIdx = i
      }
    }
    const line1 = words.slice(0, bestIdx).join(' ')
    const line2 = words.slice(bestIdx).join(' ')
    return [line1, line2]
  }
  const phrases = splitDescription(description)
  const lines = phrases.flatMap((phrase) => splitBalancedLine(phrase)).filter(Boolean)
  const screens = []
  for (let i = 0; i < lines.length; i += 2) {
    screens.push(lines.slice(i, i + 2))
    if (screens.length >= MAX_SCREENS) break
  }

  const titleLength = 4
  const firstSceneStart = titleLength + SCREEN_GAP

  const titleAlign       = options.titleAlign        || 'center'
  const descriptionAlign = options.descriptionAlign  || 'center'
  const vertical         = options.textVertical      || 'top'
  const bgMode           = options.backgroundMode    || 'none'
  const bgColor          = options.backgroundColor   || '#0f0f0f'
  const bgAssetType      = options.backgroundAssetType || 'image'
  const bgAssetUrl       = options.backgroundAssetUrl  || ''
  const musicUrl         = options.musicUrl           || ''
  const titleColor       = options.titleColor         || '#6366f1'
  const textColor        = options.textColor          || '#ffffff'
  const titleSize        = Number(options.titleSize)  || 58
  const textSize         = Number(options.textSize)   || 40

  const verticalOffsetMap = { top: -0.32, center: 0, bottom: 0.3 }
  const titleY = verticalOffsetMap[vertical] ?? -0.32
  const descriptionY = Math.min(titleY + 0.3, 0.55)

  const preTracks = []

  if (bgMode === 'asset' && bgAssetType === 'video' && bgAssetUrl) {
    preTracks.push({
      clips: [{
        asset: { type: 'video', src: bgAssetUrl, volume: 0 },
        start: 0,
        length: 'auto',
        transition: { in: 'fade', out: 'fade' }
      }]
    })
  }

  if (bgMode === 'asset' && bgAssetType !== 'video' && bgAssetUrl) {
    preTracks.push({
      clips: [{
        asset: { type: 'image', src: bgAssetUrl },
        start: 0,
        length: 'end',
        transition: { in: 'fade', out: 'fade' }
      }]
    })
  }

  if (musicUrl) {
    preTracks.push({
      clips: [{
        asset: { type: 'audio', src: musicUrl, effect: 'fadeOut', volume: 1 },
        start: 0,
        length: 'end'
      }]
    })
  }

  return {
    timeline: {
      background: bgMode === 'color' ? bgColor : '#0f0f0f',
      tracks: [
        ...preTracks,
        {
          clips: [{
            asset: {
              type: 'html',
              html: `<p>${escapeHtml(String(title || ''))}</p>`,
              css: `p { font-family: 'Open Sans', Arial, sans-serif; font-size: ${titleSize}px; font-weight: 800; color: ${titleColor}; text-align: ${titleAlign}; line-height: 1.2; margin: 0; white-space: normal; overflow-wrap: anywhere; word-break: break-word; }`,
              width: 1150,
              height: 120
            },
            start: 0,
            length: titleLength,
            position: 'center',
            offset: { x: 0, y: titleY },
            transition: { in: 'fade', out: 'fade' }
          }]
        },
        {
          clips: screens.map((screen, i) => ({
            asset: {
              type: 'html',
              html: screen
                .map((line) => `<p>${escapeHtml(String(line || '').trim())}</p>`)
                .join(''),
              css: `p { font-family: 'Open Sans', Arial, sans-serif; font-size: ${Math.max(26, Math.round(textSize * (screen.length > 2 ? 0.9 : 1)))}px; font-weight: 600; color: ${textColor}; text-align: ${descriptionAlign}; line-height: 1.35; margin: 0 0 12px 0; white-space: normal; overflow-wrap: anywhere; word-break: break-word; } p:last-child { margin-bottom: 0; }`,
              width: 1150,
              height: 320
            },
            start: firstSceneStart + i * (SCREEN_DURATION + SCREEN_GAP),
            length: SCREEN_DURATION,
            position: 'center',
            offset: { x: 0, y: descriptionY },
            transition: { in: 'fade', out: 'fade' }
          }))
        }
      ]
    },
    output: { format: 'mp4', resolution: 'hd' }
  }
}


const postShotstack = async (payload) => {
  try {
    const response = await fetch(`${EDIT_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SHOTSTACK_API_KEY
      },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    if (!response.ok || !data?.response?.id) {
      throw new Error(data?.message || 'Could not start render')
    }
    return data.response.id
  } catch (error) {
    const reason = error?.cause?.message || error?.message || 'Unknown network error'
    throw new Error(`Shotstack request failed: ${reason}`)
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true })

  if (!SHOTSTACK_API_KEY) {
    return sendJson(res, 500, { message: 'Missing SHOTSTACK_API_KEY on render proxy server' })
  }

  const url = new URL(req.url, `http://${req.headers.host}`)

  try {
    if (req.method === 'POST' && url.pathname === '/api/render/text') {
    const body = await readBody(req)
    const renderId = await postShotstack(buildTimeline(body.title, body.description, body.options || {}))
    return sendJson(res, 200, { renderId })
  }


    if (req.method === 'POST' && url.pathname === '/api/render/image') {
      const body = await readBody(req)
      const payload = {
        timeline: {
          tracks: [
            {
              clips: [
                {
                  start: 0,
                  length: 'auto',
                  asset: {
                    type: 'image-to-video',
                    src: body.imageUrl,
                    prompt: body.motionPrompt || 'Cinematic slow camera movement',
                    aspectRatio: '16:9'
                  }
                }
              ]
            }
          ]
        },
        output: { format: 'mp4', size: { width: 1280, height: 720 } }
      }
      const renderId = await postShotstack(payload)
      return sendJson(res, 200, { renderId })
    }

    if (req.method === 'GET' && (url.pathname.startsWith('/api/render/') || url.pathname === '/api/render/status')) {
      const renderId = url.pathname === '/api/render/status'
        ? url.searchParams.get('id')
        : url.pathname.replace('/api/render/', '')
      if (!renderId) return sendJson(res, 400, { message: 'Missing render id' })
      try {
        const response = await fetch(`${EDIT_URL}/render/${renderId}`, {
          headers: { 'x-api-key': SHOTSTACK_API_KEY }
        })
        const data = await response.json()
        if (!response.ok) return sendJson(res, 502, { message: data?.message || 'Failed to poll render' })
        return sendJson(res, 200, {
          status: data?.response?.status || 'unknown',
          url: data?.response?.url || ''
        })
      } catch (error) {
        const reason = error?.cause?.message || error?.message || 'Unknown network error'
        return sendJson(res, 502, { message: `Shotstack poll failed: ${reason}` })
      }
    }

    return sendJson(res, 404, { message: 'Not found' })
  } catch (error) {
    return sendJson(res, 500, { message: error?.message || 'Render proxy error' })
  }
})

server.listen(PORT, () => {
  console.log(`Render proxy listening on http://localhost:${PORT}`)
})
