exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) }
  }

  try {
    const { title, description, options = {} } = JSON.parse(event.body || '{}')
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
    const bgMode = options.backgroundMode || 'none'
    const bgColor = options.backgroundColor || '#0f0f0f'
    const bgAssetType = options.backgroundAssetType || 'image'
    const bgAssetUrl = options.backgroundAssetUrl || ''
    const musicUrl = options.musicUrl || ''
    const titleColor = options.titleColor || '#6366f1'
    const textColor = options.textColor || '#ffffff'
    const titleSize = Number(options.titleSize) || 58
    const textSize = Number(options.textSize) || 40
    const alignX = { left: -0.6, center: 0, right: 0.6 }
    const centerYByLines = { 1: 0.12, 2: 0.08, 3: 0.05 }
    const titleX = alignX[titleAlign] ?? 0
    const descriptionX = alignX[descriptionAlign] ?? 0

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

    const payload = {
      timeline: {
        background: bgMode === 'color' ? bgColor : '#0f0f0f',
        tracks: [
          ...preTracks,
        {
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
              offset: { x: titleX, y: centerYByLines[1] },
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
              offset: { x: descriptionX, y: centerYByLines[Math.min(3, block.length)] ?? 0.08 },
              transition: { in: 'fade', out: 'fade' }
            }))
          ]
        }
      ]
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
      return { statusCode: 502, body: JSON.stringify({ message: data?.message || 'Shotstack create render failed' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ renderId: data.response.id }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err?.message || 'render-text failed' }) }
  }
}