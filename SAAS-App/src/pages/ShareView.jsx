import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { databases } from '../lib/appwrite'
import { APPWRITE_DATABASE_ID, APPWRITE_SHARES_COLLECTION_ID } from '../lib/config'

const ShareView = () => {
  const { projectId } = useParams()
  const location = useLocation()
  const [share, setShare] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [sharedMeta, setSharedMeta] = useState({ comments: [], scenes: [] })
  const [access, setAccess] = useState({ exp: 0, nodl: false, phash: '' })

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const legacyExp = Number(params.get('exp') || 0)
  const legacyNoDownload = params.get('nodl') === '1'
  const legacyPasswordHash = params.get('phash') || ''

  const hashPassword = async (text) => {
    const enc = new TextEncoder().encode(text)
    const digest = await crypto.subtle.digest('SHA-256', enc)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const result = await databases.getDocument({
          databaseId: APPWRITE_DATABASE_ID,
          collectionId: APPWRITE_SHARES_COLLECTION_ID,
          documentId: projectId
        })
        setShare(result)
        try {
          const parsed = JSON.parse(result.metadata || '{}')
          setSharedMeta(parsed)
          const accessFromDoc = parsed?.access || {}
          const nextAccess = {
            exp: Number(accessFromDoc.exp || legacyExp || 0),
            nodl: Boolean(accessFromDoc.nodl || legacyNoDownload),
            phash: accessFromDoc.phash || legacyPasswordHash || ''
          }
          setAccess(nextAccess)

          if (nextAccess.exp && Date.now() > nextAccess.exp) {
            setError('This shared link has expired.')
            return
          }

          setAuthorized(!nextAccess.phash)
        } catch {
          setSharedMeta({ comments: [], scenes: [] })
          setAccess({ exp: legacyExp, nodl: legacyNoDownload, phash: legacyPasswordHash })
          if (legacyExp && Date.now() > legacyExp) {
            setError('This shared link has expired.')
            return
          }
          setAuthorized(!legacyPasswordHash)
        }
      } catch {
        setError('This video is not available or the link has expired.')
      } finally {
        setLoading(false)
      }
    }
    fetchShare()
  }, [projectId, legacyExp, legacyNoDownload, legacyPasswordHash])

  const unlock = async () => {
    const entered = await hashPassword(passwordInput.trim())
    if (entered === access.phash) {
      setAuthorized(true)
      setError('')
    } else {
      setError('Wrong password.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-s1 flex items-center justify-center">
        <div className="size-12 border-4 border-p1/30 border-t-p1 rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !share) {
    return (
      <div className="min-h-screen bg-s1 flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-red-400 text-lg">{error}</p>
        <Link to="/" className="text-p1 hover:underline text-sm">
          Back to homepage
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-s1 text-white flex flex-col">
      <header className="border-b border-s3/20 px-8 py-4 flex items-center justify-between">
        <Link to="/">
          <img src="/images/xora.svg" width={100} height={40} alt="Trimix AI" />
        </Link>
        <Link to="/signup" className="bg-p1 hover:bg-p1/80 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
          Create your own
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          <p className="text-p3 text-xs uppercase tracking-widest mb-3">Shared Video</p>
          <h1 className="text-3xl font-bold mb-8">{share?.title}</h1>

          {!authorized ? (
            <div className="bg-s2 border border-s3/20 rounded-2xl p-6">
              <p className="text-gray-300 mb-3">This video is password protected.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="flex-1 rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10"
                />
                <button onClick={unlock} className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-md text-sm font-semibold">
                  Unlock
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            </div>
          ) : (
            <>
              <div className="bg-s2 border border-s3/20 rounded-2xl overflow-hidden">
                <video controls autoPlay className="w-full" src={share?.videoUrl} />
              </div>

              {sharedMeta.scenes?.length > 0 && (
                <div className="mt-6 bg-s2 border border-s3/20 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest text-p3 mb-3">Scenes</p>
                  <div className="space-y-2">
                    {sharedMeta.scenes.map((scene, idx) => (
                      <div key={scene.id || idx} className="border border-white/10 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400 mb-1">Scene {idx + 1}</p>
                        <p className="text-sm">{scene.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sharedMeta.comments?.length > 0 && (
                <div className="mt-4 bg-s2 border border-s3/20 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest text-p3 mb-3">Comments</p>
                  <div className="space-y-2">
                    {sharedMeta.comments.map((comment) => (
                      <div key={comment.id} className="border border-white/10 rounded-lg px-3 py-2">
                        <p className="text-sm">{comment.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{comment.author}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-4 mt-6">
                {!access.nodl && (
                  <a
                    href={share?.videoUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="bg-p1 hover:bg-p1/80 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Download
                  </a>
                )}
                <Link to="/signup" className="border border-s3/20 text-p3 hover:text-p1 px-6 py-2.5 rounded-xl text-sm transition-colors">
                  Make your own video
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShareView
