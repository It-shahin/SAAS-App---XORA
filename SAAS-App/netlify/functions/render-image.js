exports.handler = async (event) => {
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
