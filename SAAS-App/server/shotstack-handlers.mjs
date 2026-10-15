export const renderText = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) }
  }

  try {
    const { title, description, options = {} } = JSON.parse(event.body || '{}')
    if (!String(title || '').trim()) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing title' }) }
    }
    if (!String(description || '').trim()) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing description' }) }
    }
    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Missing SHOTSTACK_API_KEY' }) }
    }

    const REFERENCE_SENTENCE = 'A young man dancing with confidence in a modern'
    const MAX_CHARS_PER_LINE = REFERENCE_SENTENCE.length
    const MAX_LINES_PER_BLOCK = 2
    const MAX_BLOCKS = 6
    const splitToBlocks = (raw = '') => {
      const words = String(raw).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
      if (words.length === 0) return []
      const lines = []
      let current = ''
      for (const word of words) {
        const next = current ? `${current} ${word}` : word
        if (next.length > MAX_CHARS_PER_LINE) {
          if (current) lines.push(current)
          current = word
        } else {
          current = next
        }
      }
      if (current) lines.push(current)
      const blocks = []
      for (let i = 0; i < lines.length; i += MAX_LINES_PER_BLOCK) {
        blocks.push(lines.slice(i, i + MAX_LINES_PER_BLOCK))
        if (blocks.length >= MAX_BLOCKS) break
      }
      return blocks
    }
    const blocksFromClient = Array.isArray(options.subtitleBlocks)
      ? options.subtitleBlocks
          .filter((b) => Array.isArray(b) || (b && Array.isArray(b.lines)))
          .map((b) => (Array.isArray(b) ? b : b.lines).map((line) => String(line || '').trim()).filter(Boolean))
          .filter((b) => b.length > 0)
      : []
    const blocks = blocksFromClient.length > 0
      ? blocksFromClient.slice(0, MAX_BLOCKS)
      : splitToBlocks(description)
    const titleLength = 3
    const sceneLength = 3
    const titleAlign = options.titleAlign || 'center'
    const descriptionAlign = options.descriptionAlign || 'center'
    const textVertical = options.textVertical || 'center'
    const bgMode = options.backgroundMode || 'none'
    const bgColor = options.backgroundColor || '#0f0f0f'
    const bgAssetType = options.backgroundAssetType || 'image'
    const bgAssetUrl = options.backgroundAssetUrl || ''
    const musicUrl = options.musicUrl || ''
    const titleColor = options.titleColor || '#6366f1'
    const textColor = options.textColor || '#ffffff'
    const titleSize = Number(options.titleSize) || 58
    const textSize = Number(options.textSize) || 40
    const alignX = { left: -0.35, center: 0, right: 0.35 }
    const safeY = { top: 0.3, center: 0.1, bottom: -0.3 }
    const titleX = alignX[titleAlign] ?? 0
    const descriptionX = alignX[descriptionAlign] ?? 0
    const titleY = safeY.center
    const descriptionY = safeY[textVertical] ?? safeY.center

    const totalTextDuration = titleLength + blocks.length * sceneLength
    const tracks = []

    // Track 0: background media (when selected)
    if (bgMode === 'asset' && bgAssetType === 'video' && bgAssetUrl) {
      tracks.push({
        clips: [{
          asset: { type: 'video', src: bgAssetUrl, volume: 0 },
          start: 0,
          length: totalTextDuration,
          transition: { in: 'fade', out: 'fade' }
        }]
      })
    } else if (bgMode === 'asset' && bgAssetType !== 'video' && bgAssetUrl) {
      tracks.push({
        clips: [{
          asset: { type: 'image', src: bgAssetUrl },
          start: 0,
          length: totalTextDuration,
          transition: { in: 'fade', out: 'fade' }
        }]
      })
    }

    // Track 1+: text overlays (always above background)
    const textTrack = {
      clips: [
        {
          asset: {
            type: 'text',
            text: String(title || ''),
            font: { family: 'Clear Sans', color: titleColor, size: titleSize },
            alignment: { horizontal: titleAlign, vertical: 'center' },
            width: 1000,
            height: 140
          },
          start: 0,
          length: titleLength,
          position: 'center',
          offset: { x: titleX, y: titleY },
          transition: { in: 'fade', out: 'fade' }
        },
        ...blocks.map((block, i) => ({
          asset: {
            type: 'text',
            text: block.join('\n'),
            font: { family: 'Clear Sans', color: textColor, size: textSize },
            alignment: { horizontal: descriptionAlign, vertical: 'center' },
            width: 1000,
            height: 260
          },
          start: titleLength + i * sceneLength,
          length: sceneLength,
          position: 'center',
          offset: { x: descriptionX, y: descriptionY },
          transition: { in: 'fade', out: 'fade' }
        }))
      ]
    }
    tracks.push(textTrack)

    // Optional audio on top track (does not hide text)
    if (musicUrl) {
      tracks.push({
        clips: [{
          asset: { type: 'audio', src: musicUrl, effect: 'fadeOut', volume: 1 },
          start: 0,
          length: totalTextDuration
        }]
      })
    }

    const payload = {
      timeline: {
        background: bgMode === 'color' ? bgColor : '#0f0f0f',
        tracks
      },
      output: { format: 'mp4', resolution: 'hd' }
    }

    const res = await fetch('https://api.shotstack.io/edit/stage/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok || !data?.response?.id) {
      console.error('render-text shotstack-failure', { status: res.status, body: data })
      return { statusCode: 502, body: JSON.stringify({ message: data?.message || 'Shotstack create render failed' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ renderId: data.response.id }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err?.message || 'render-text failed' }) }
  }
}

export const renderImage = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) }
  }

  try {
    const { imageUrl, motionPrompt } = JSON.parse(event.body || '{}')
    if (!String(imageUrl || '').trim()) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing imageUrl' }) }
    }
    try {
      const parsed = new URL(imageUrl)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid imageUrl protocol' }) }
      }
    } catch {
      return { statusCode: 400, body: JSON.stringify({ message: 'Invalid imageUrl' }) }
    }
    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Missing SHOTSTACK_API_KEY' }) }
    }

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
                  src: imageUrl,
                  prompt: motionPrompt || 'Cinematic slow camera movement',
                  aspectRatio: '16:9'
                }
              }
            ]
          }
        ]
      },
      output: {
        format: 'mp4',
        size: { width: 1280, height: 720 }
      }
    }

    const res = await fetch('https://api.shotstack.io/edit/stage/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok || !data?.response?.id) {
      console.error('render-image shotstack-failure', { status: res.status, body: data })
      return { statusCode: 502, body: JSON.stringify({ message: data?.message || 'Shotstack image render failed' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ renderId: data.response.id }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err?.message || 'render-image failed' }) }
  }
}

export const renderStatus = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) }
  }

  try {
    const renderId = event.queryStringParameters?.id
    if (!renderId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing render id' }) }
    }

    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Missing SHOTSTACK_API_KEY' }) }
    }

    const res = await fetch(`https://api.shotstack.io/edit/stage/render/${renderId}`, {
      headers: { 'x-api-key': apiKey }
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('render-status shotstack-failure', { status: res.status, body: data, renderId })
      return { statusCode: 502, body: JSON.stringify({ message: data?.message || 'Shotstack poll failed' }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: data?.response?.status || 'unknown',
        url: data?.response?.url || ''
      })
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err?.message || 'render-status failed' }) }
  }
}

