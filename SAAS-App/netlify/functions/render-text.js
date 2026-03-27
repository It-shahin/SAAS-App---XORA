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
