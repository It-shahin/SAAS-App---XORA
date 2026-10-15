import { RENDER_PROXY_URL } from './config'
import { account } from './appwrite'

const normalizeBase = (base) => {
  if (!base || base === '/') return ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

const request = async (path, options = {}) => {
  const { jwt } = await account.createJWT()
  const response = await fetch(`${normalizeBase(RENDER_PROXY_URL)}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}), Authorization: `Bearer ${jwt}` }
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || 'Render service request failed')
  }
  return data
}

export const submitRender = async (title, description, options = {}) => {
  const data = await request('/api/render/text', {
    method: 'POST',
    body: JSON.stringify({ title, description, options })
  })
  if (data.pollToken) localStorage.setItem(`shotstack-receipt:${data.renderId}`, data.pollToken)
  return data.renderId
}

export const submitImageRender = async (imageUrl, motionPrompt) => {
  const data = await request('/api/render/image', {
    method: 'POST',
    body: JSON.stringify({ imageUrl, motionPrompt })
  })
  if (data.pollToken) localStorage.setItem(`shotstack-receipt:${data.renderId}`, data.pollToken)
  return data.renderId
}

export const pollRender = async (renderId) => {
  const pollToken = localStorage.getItem(`shotstack-receipt:${renderId}`) || ''
  const data = await request(`/api/render/status?id=${encodeURIComponent(renderId)}`, {
    headers: { 'X-Render-Receipt': pollToken }
  })
  return { status: data.status, url: data.url }
}

