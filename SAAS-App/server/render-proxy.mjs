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

const buildTimeline = (title, description, style, options = {}) => {
  const colors = {
    clean: { bg: '#0f0f0f', text: '#ffffff', accent: '#6366f1' },
    bold: { bg: '#1a0533', text: '#ffffff', accent: '#a855f7' },
    minimal: { bg: '#f5f5f5', text: '#111111', accent: '#6366f1' },
    corporate: { bg: '#0a1628', text: '#ffffff', accent: '#3b82f6' }
  }
  const palette = colors[style] || colors.clean
  const sentences = (String(description || '').match(/[^.!?]+[.!?]+/g) || [description]).slice(0, 4)

  const titleLength = 4
  const sceneGap = 0.6
  const sceneLength = 4.2
  const sceneStep = sceneLength + sceneGap
  const firstSceneStart = titleLength + sceneGap
  const titleAlign = options.titleAlign || 'center'
  const descriptionAlign = options.descriptionAlign || 'center'
  const vertical = options.textVertical || 'top'
  const bgMode = options.backgroundMode || 'none'
  const bgColor = options.backgroundColor || palette.bg
  const bgAssetType = options.backgroundAssetType || 'image'
  const bgAssetUrl = options.backgroundAssetUrl || ''
  const musicUrl = options.musicUrl || ''

  const verticalOffsetMap = {
    top: -0.32,
    center: 0,
    bottom: 0.3
  }
  const titleY = verticalOffsetMap[vertical] ?? -0.32
  const descriptionY = Math.min(titleY + 0.3, 0.55)

  const preTracks = []

  if (bgMode === 'asset' && bgAssetType === 'video' && bgAssetUrl) {
    preTracks.push({
      clips: [
        {
          asset: { type: 'video', src: bgAssetUrl, volume: 0 },
          start: 0,
          length: 'auto',
          transition: { in: 'fade', out: 'fade' }
        }
      ]
    })
  }

  if (bgMode === 'asset' && bgAssetType !== 'video' && bgAssetUrl) {
    preTracks.push({
      clips: [
        {
          asset: { type: 'image', src: bgAssetUrl },
          start: 0,
          length: 'end',
          transition: { in: 'fade', out: 'fade' }
        }
      ]
    })
  }

  if (musicUrl) {
    preTracks.push({
      clips: [
        {
          asset: { type: 'audio', src: musicUrl, effect: 'fadeOut', volume: 1 },
          start: 0,
          length: 'end'
        }
      ]
    })
  }

  return {
    timeline: {
      background: bgMode === 'color' ? bgColor : palette.bg,
      tracks: [
        ...preTracks,
        {
          clips: [
            {
              asset: {
                type: 'text',
                text: String(title || ''),
                font: {
                  family: 'Clear Sans',
                  color: palette.accent,
                  size: 58
                },
                alignment: { horizontal: titleAlign },
                width: 900,
                height: 90
              },
              start: 0,
              length: titleLength,
              position: 'center',
              offset: { x: 0, y: titleY },
              transition: { in: 'fade', out: 'fade' }
            }
          ]
        },
        {
          clips: sentences.map((sentence, i) => ({
            asset: {
              type: 'text',
              text: String(sentence || '').trim(),
              font: {
                family: 'Clear Sans',
                color: palette.text,
                size: 40
              },
              alignment: { horizontal: descriptionAlign },
              width: 1000,
              height: 220
            },
            start: firstSceneStart + i * sceneStep,
            length: sceneLength,
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
      const renderId = await postShotstack(buildTimeline(body.title, body.description, body.style, body.options || {}))
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
