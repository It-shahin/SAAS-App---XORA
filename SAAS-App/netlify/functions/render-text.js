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

    const MAX_CHARS_PER_LINE = 40
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
        blocks.push({ lines: lines.slice(i, i + MAX_LINES_PER_BLOCK) })
        if (blocks.length >= MAX_BLOCKS) break
      }
      return blocks
    }
    const blocks = splitToBlocks(description)
    const titleLength = 4
    const sceneGap = 0.6
    const sceneLength = 3
    const sceneStep = sceneLength + sceneGap
    const firstSceneStart = titleLength + sceneGap

    const titleAlign = options.titleAlign || 'center'
    const descriptionAlign = options.descriptionAlign || 'center'
    const vertical = options.textVertical || 'top'
    const bgMode = options.backgroundMode || 'none'
    const bgColor = options.backgroundColor || '#0f0f0f'
    const bgAssetType = options.backgroundAssetType || 'image'
    const bgAssetUrl = options.backgroundAssetUrl || ''
    const musicUrl = options.musicUrl || ''
    const titleColor = options.titleColor || '#6366f1'
    const textColor = options.textColor || '#ffffff'
    const titleSize = Number(options.titleSize) || 58
    const textSize = Number(options.textSize) || 40
    const escapeHtml = (v = '') =>
      String(v)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')

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

    const payload = {
      timeline: {
        background: bgMode === 'color' ? bgColor : '#0f0f0f',
        tracks: [
          ...preTracks,
          {
            clips: [
              {
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
              }
            ]
          },
          {
            clips: blocks.map((block, i) => ({
              asset: {
                type: 'html',
                html: `<p>${block.lines.map((line) => escapeHtml(line)).join('<br/>')}</p>`,
                css: `p { font-family: 'Open Sans', Arial, sans-serif; font-size: ${textSize}px; font-weight: 600; color: ${textColor}; text-align: ${descriptionAlign}; line-height: 1.35; margin: 0; white-space: normal; overflow-wrap: anywhere; word-break: break-word; }`,
                width: 1150,
                height: 260
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
