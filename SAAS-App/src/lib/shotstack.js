const SHOTSTACK_API_KEY = import.meta.env.VITE_SHOTSTACK_API_KEY
const EDIT_URL = 'https://api.shotstack.io/edit/stage'
const CREATE_URL = 'https://api.shotstack.io/create/stage'

const buildTimeline = (title, description, style) => {
  const colors = {
    clean:     { bg: '#0f0f0f', text: '#ffffff', accent: '#6366f1' },
    bold:      { bg: '#1a0533', text: '#ffffff', accent: '#a855f7' },
    minimal:   { bg: '#f5f5f5', text: '#111111', accent: '#6366f1' },
    corporate: { bg: '#0a1628', text: '#ffffff', accent: '#3b82f6' }
  }

  const palette = colors[style] || colors.clean
  const sentences = (description.match(/[^.!?]+[.!?]+/g) || [description]).slice(0, 3)

  const titleClip = {
    asset: {
      type: 'html',
      html: `<p>${title}</p>`,
      css: `p { font-family: 'Open Sans'; font-size: 72px; font-weight: 800; color: ${palette.accent}; text-align: center; }`,
      width: 1100,
      height: 200
    },
    start: 0,
    length: 4,
    position: 'center',
    transition: { in: 'fade', out: 'fade' }
  }

  const sceneClips = sentences.map((sentence, i) => ({
    asset: {
      type: 'html',
      html: `<p>${sentence.trim()}</p>`,
      css: `p { font-family: 'Open Sans'; font-size: 42px; color: ${palette.text}; text-align: center; line-height: 1.4; }`,
      width: 1000,
      height: 300
    },
    start: i * 5,
    length: 4.5,
    position: 'center',
    transition: { in: 'fade', out: 'fade' }
  }))

  return {
    timeline: {
      background: palette.bg,
      tracks: [
        { clips: [titleClip] },
        { clips: sceneClips }
      ]
    },
    output: {
      format: 'mp4',
      resolution: 'hd'
    }
  }
}

export const submitRender = async (title, description, style) => {
  const payload = buildTimeline(title, description, style)
  console.log('Sending to Shotstack:', JSON.stringify(payload, null, 2))

  const response = await fetch(`${EDIT_URL}/render`, {  // ← fixed
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SHOTSTACK_API_KEY
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  console.log('Shotstack response:', data)

  if (!response.ok) {
    const errors = data.response?.errors?.map(e => e.message).join(', ') || data.message
    throw new Error(errors || 'Shotstack render failed')
  }

  return data.response.id
}

export const pollRender = async (renderId) => {
  const response = await fetch(`${EDIT_URL}/render/${renderId}`, {  // ← fixed
    headers: { 'x-api-key': SHOTSTACK_API_KEY }
  })

  const data = await response.json()
  console.log('Poll status:', data.response?.status, '| URL:', data.response?.url)

  if (!response.ok) throw new Error('Failed to check render status')

  return {
    status: data.response.status,
    url: data.response.url
  }
}

export const submitImageRender = async (imageUrl, motionPrompt) => {
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

  const response = await fetch(`${EDIT_URL}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SHOTSTACK_API_KEY
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  console.log('Image-to-video render:', data)

  if (!response.ok) {
    const errors = data.response?.errors?.map(e => e.message).join(', ') || data.message
    throw new Error(errors || 'Image to video render failed')
  }

  return data.response.id
}
