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
    const bgColor = options.backgroundColor || '#0f0f0f'
    const bgAssetType = options.backgroundAssetType || 'image'
    const bgAssetUrl = options.backgroundAssetUrl || ''
    const musicUrl = options.musicUrl || ''
    const titleColor = options.titleColor || '#6366f1'
    const textColor = options.textColor || '#ffffff'
    const titleSize = Number(options.titleSize) || 58
    const textSize = Number(options.textSize) || 40

    const verticalOffsetMap = { top: -0.32, center: 0, bottom: 0.3 }
    const titleY = verticalOffsetMap[vertical] ?? -0.32
    const descriptionY = Math.min(titleY + 0.3, 0.55)

    const alignOffsetMap = { left: -0.28, center: 0, right: 0.28 }
    const titleX = alignOffsetMap[titleAlign] ?? 0
    const descriptionX = alignOffsetMap[descriptionAlign] ?? 0

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
                  alignment: { horizontal: titleAlign },
                  width: 900,
                  height: 90
                },
                start: 0,
                length: titleLength,
                position: 'center',
                offset: { x: titleX, y: titleY },
                transition: { in: 'fade', out: 'fade' }
              }
            ]
          },
          {
            clips: sentences.map((s, i) => ({
              asset: {
                type: 'text',
                text: String(s || '').trim(),
                font: { family: 'Clear Sans', color: textColor, size: textSize },
                alignment: { horizontal: descriptionAlign },
                width: 1000,
                height: 220
              },
              start: firstSceneStart + i * sceneStep,
              length: sceneLength,
              position: 'center',
              offset: { x: descriptionX, y: descriptionY },
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
