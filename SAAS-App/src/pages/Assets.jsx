import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { uploadImage } from '../lib/upload'
import { addAsset, listAssets, removeAsset as deleteAsset } from '../lib/collaboration'

const Assets = () => {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const loadAssets = async () => {
    setFetching(true)
    try {
      const docs = await listAssets()
      setAssets(docs)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    loadAssets()
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const url = await uploadImage(file)
      await addAsset(file.name, url)
      await loadAssets()
    } catch {
      setError('Failed to upload asset.')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  const handleRemoveAsset = async (id) => {
    if (!window.confirm('Remove this asset from your library?')) return
    await deleteAsset(id)
    await loadAssets()
  }

  const handleCopyLink = async (id, url) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(''), 1500)
    } catch {
      setError('Could not copy asset link.')
    }
  }

  const filteredAssets = assets.filter((asset) =>
    asset.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
          Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-4">Media Assets</h1>
        <p className="text-gray-400 mt-2 mb-8">Private to your account only. Manage reusable image assets for video backgrounds.</p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="inline-flex items-center justify-center gap-3 bg-indigo-500 hover:bg-indigo-600 px-5 py-3 rounded-xl cursor-pointer font-semibold">
            <span>{loading ? 'Uploading...' : 'Upload New Asset'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by name..."
            className="sm:ml-auto w-full sm:w-72 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={loadAssets}
            className="border border-white/10 hover:border-indigo-500/50 px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
          >
            Refresh
          </button>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        <div className="mb-4 text-sm text-gray-400">
          {fetching ? 'Loading assets...' : `${filteredAssets.length} asset${filteredAssets.length === 1 ? '' : 's'} shown`}
        </div>

        {!fetching && filteredAssets.length === 0 ? (
          <p className="text-gray-400">{assets.length === 0 ? 'No assets uploaded yet.' : 'No assets match your search.'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssets.map((asset) => (
              <div key={asset.$id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <img src={asset.url} alt={asset.name} className="w-full h-40 object-cover rounded-xl mb-3" />
                <p className="text-sm truncate">{asset.name}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(asset.$id, asset.url)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-indigo-500/50 text-gray-300 hover:text-white"
                  >
                    {copiedId === asset.$id ? 'Copied' : 'Copy link'}
                  </button>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-indigo-500/50 text-gray-300 hover:text-white"
                  >
                    Open
                  </a>
                  <button
                    onClick={() => handleRemoveAsset(asset.$id)}
                    className="ml-auto text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Assets
