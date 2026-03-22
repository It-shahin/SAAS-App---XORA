import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { databases } from '../lib/appwrite'

const SHARE_DATABASE_ID = '69ba0d06002eebdcbb81'
const SHARE_COLLECTION_ID = 'shares'

const ShareView = () => {
  const { projectId } = useParams()
  const [share, setShare] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const result = await databases.getDocument({
          databaseId: SHARE_DATABASE_ID,
          collectionId: SHARE_COLLECTION_ID,
          documentId: projectId
        })
        setShare(result)
      } catch (err) {
        setError(err,'This video is not available or the link has expired.')
      } finally {
        setLoading(false)
      }
    }
    fetchShare()
  }, [projectId])

  if (loading) return (
    <div className="min-h-screen bg-s1 flex items-center justify-center">
      <div className="size-12 border-4 border-p1/30 border-t-p1 rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-s1 flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-red-400 text-lg">{error}</p>
      <Link to="/" className="text-p1 hover:underline text-sm">← Back to homepage</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-s1 text-white flex flex-col">

      {/* Header */}
      <header className="border-b border-s3/20 px-8 py-4 flex items-center justify-between">
        <Link to="/">
          <img src="/images/xora.svg" width={100} height={40} alt="logo" />
        </Link>
        <Link
          to="/signup"
          className="bg-p1 hover:bg-p1/80 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
        >
          Create your own ✨
        </Link>
      </header>

      {/* Video */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          <p className="text-p3 text-xs uppercase tracking-widest mb-3">Shared Video</p>
          <h1 className="text-3xl font-bold mb-8">{share.title}</h1>

          <div className="bg-s2 border border-s3/20 rounded-2xl overflow-hidden">
            <video
              controls
              autoPlay
              className="w-full"
              src={share.videoUrl}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <a
              href={share.videoUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="bg-p1 hover:bg-p1/80 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              ⬇ Download
            </a>
            <Link
              to="/signup"
              className="border border-s3/20 text-p3 hover:text-p1 px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              ✨ Make your own video
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}

export default ShareView
