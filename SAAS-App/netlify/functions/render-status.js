exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) }
  }

  try {
    const renderId = event.queryStringParameters?.id
    if (!renderId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing render id' }) }
    }

    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Missing SHOTSTACK_API_KEY' }) }
    }

    const res = await fetch(`https://api.shotstack.io/edit/stage/render/${renderId}`, {
      headers: { 'x-api-key': apiKey }
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('render-status shotstack-failure', { status: res.status, body: data, renderId })
      return { statusCode: 502, body: JSON.stringify({ message: data?.message || 'Shotstack poll failed' }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: data?.response?.status || 'unknown',
        url: data?.response?.url || ''
      })
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err?.message || 'render-status failed' }) }
  }
}
