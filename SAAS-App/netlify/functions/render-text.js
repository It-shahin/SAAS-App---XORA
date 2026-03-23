exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) }
  }

  try {
    const { title, description, style } = JSON.parse(event.body || '{}')
    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Missing SHOTSTACK_API_KEY' }) }
    }

    const colors = {
      clean: { bg: '#0f0f0f', text: '#ffffff', accent: '#6366f1' },
      bold: { bg: '#1a0533', text: '#ffffff', accent: '#a855f7' },
      minimal: { bg: '#f5f5f5', text: '#111111', accent: '#6366f1' },
      corporate: { bg: '#0a1628', text: '#ffffff', accent: '#3b82f6' }
    }
    const palette = colors[style] || colors.clean

    const escapeHtml = (v = '') =>
      String(v)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')

    const sentences = (String(description || '').match(/[^.!?]+[.!?]+/g) || [description]).slice(0, 4)

    const payload = {
      timeline: {
        background: palette.bg,
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: 'html',
                  html: `<p>${escapeHtml(title)}</p>`,
                  css: `p { font-family: 'Open Sans'; font-size: 64px; font-weight: 800; color: ${palette.accent}; text-align: center; }`,
                  width: 1100,
                  height: 200
                },
                start: 0,
                length: 4,
                position: 'center',
                transition: { in: 'fade', out: 'fade' }
              }
            ]
          },
          {
            clips: sentences.map((s, i) => ({
              asset: {
                type: 'html',
                html: `<p>${escapeHtml(String(s || '').trim())}</p>`,
                css: `p { font-family: 'Open Sans'; font-size: 40px; color: ${palette.text}; text-align: center; line-height: 1.4; }`,
                width: 1000,
                height: 300
              },
              start: i * 4.8,
              length: 4.2,
              position: 'center',
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
