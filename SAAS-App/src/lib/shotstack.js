import { RENDER_PROXY_URL } from './config'

const normalizeBase = (base) => {
  if (!base || base === '/') return ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

const request = async (path, options = {}) => {
  const response = await fetch(`${normalizeBase(RENDER_PROXY_URL)}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || 'Render service request failed')
  }
  return data
}

export const submitRender = async (title, description, style, options = {}) => {
  const data = await request('/api/render/text', {
    method: 'POST',
    body: JSON.stringify({ title, description, style, options })
  })
  return data.renderId
}

export const submitImageRender = async (imageUrl, motionPrompt) => {
  const data = await request('/api/render/image', {
    method: 'POST',
    body: JSON.stringify({ imageUrl, motionPrompt })
  })
  return data.renderId
}

export const pollRender = async (renderId) => {
  const data = await request(`/api/render/status?id=${encodeURIComponent(renderId)}`)
  return { status: data.status, url: data.url }
}
