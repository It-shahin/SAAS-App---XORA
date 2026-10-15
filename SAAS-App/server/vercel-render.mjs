import { renderText, renderImage, renderStatus } from './shotstack-handlers.mjs'

const json = (message, status) => Response.json({ message }, {
  status, headers: { 'Cache-Control': 'no-store' }
})

export async function handleRender(request) {
  const operation = new URL(request.url).pathname.split('/').pop()
  const methods = { text: 'POST', image: 'POST', status: 'GET' }
  if (!methods[operation]) return json('Not found', 404)
  if (request.method !== methods[operation]) return json('Method not allowed', 405)

  const authorization = request.headers.get('authorization') || ''
  if (!authorization.startsWith('Bearer ')) return json('Sign in to render videos.', 401)
  const endpoint = process.env.VITE_APPWRITE_ENDPOINT
  const projectId = process.env.VITE_APPWRITE_PROJECT_ID
  if (!endpoint || !projectId) return json('Render authentication is not configured.', 503)
  const headers = { 'X-Appwrite-Project': projectId, 'X-Appwrite-JWT': authorization.slice(7) }

  try {
    const accountResponse = await fetch(`${endpoint}/account`, { headers })
    if (!accountResponse.ok) return json('Your session expired. Sign in again.', 401)
    const user = await accountResponse.json()
    if (!user.$id) return json('Your session expired. Sign in again.', 401)

    const url = new URL(request.url)
    if (operation === 'status') {
      const id = url.searchParams.get('id')
      if (!id || !/^[a-zA-Z0-9-]{1,100}$/.test(id)) return json('Invalid render id.', 400)
      // Appwrite enforces document permissions using the requesting user's JWT.
      const documentsUrl = new URL(`${endpoint}/databases/${encodeURIComponent(process.env.VITE_APPWRITE_DATABASE_ID)}/collections/${encodeURIComponent(process.env.VITE_APPWRITE_PROJECTS_COLLECTION_ID)}/documents`)
      documentsUrl.searchParams.append('queries[]', JSON.stringify({ method: 'equal', attribute: 'renderID', values: [id] }))
      documentsUrl.searchParams.append('queries[]', JSON.stringify({ method: 'limit', values: [1] }))
      const projectsResponse = await fetch(documentsUrl, { headers })
      if (!projectsResponse.ok) return json('Unable to verify render ownership.', 503)
      const projects = await projectsResponse.json()
      if (!projects.documents?.some(project => project.userID === user.$id)) return json('Render not found.', 404)
    }

    let body = ''
    if (request.method === 'POST') {
      if (Number(request.headers.get('content-length')) > 32768) return json('Render request is too large.', 413)
      body = await request.text()
      if (body.length > 32768) return json('Render request is too large.', 413)
      let data
      try { data = JSON.parse(body) } catch { return json('Invalid JSON.', 400) }
      if (operation === 'text' && (String(data.title || '').length > 255 || String(data.description || '').length > 12000)) {
        return json('Shorten the title or script before rendering.', 400)
      }
    }
    if (!process.env.SHOTSTACK_API_KEY) return json('Video rendering is not configured.', 503)
    const handler = { text: renderText, image: renderImage, status: renderStatus }[operation]
    const result = await handler({
      httpMethod: request.method,
      queryStringParameters: Object.fromEntries(url.searchParams),
      body
    })
    return new Response(result.body, {
      status: result.statusCode,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    console.error('Render service failed', { name: error?.name })
    return json('Video rendering is temporarily unavailable.', 502)
  }
}

