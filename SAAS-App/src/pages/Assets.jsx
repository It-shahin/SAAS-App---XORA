import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { uploadImage } from '../lib/upload'
import { addAsset, listAssets, removeAsset as deleteAsset } from '../lib/collaboration'

const Assets = () => {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadAssets = async () => {
    const docs = await listAssets()
    setAssets(docs)
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
    await deleteAsset(id)
    await loadAssets()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
          Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-4">Media Assets</h1>
        <p className="text-gray-400 mt-2 mb-8">Private to your account only.</p>

        <div className="mb-8">
          <label className="inline-flex items-center gap-3 bg-indigo-500 hover:bg-indigo-600 px-5 py-3 rounded-xl cursor-pointer font-semibold">
            <span>{loading ? 'Uploading...' : 'Upload New Asset'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {assets.length === 0 ? (
          <p className="text-gray-400">No assets uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assets.map((asset) => (
              <div key={asset.$id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <img src={asset.url} alt={asset.name} className="w-full h-40 object-cover rounded-xl mb-3" />
                <p className="text-sm truncate">{asset.name}</p>
                <button onClick={() => handleRemoveAsset(asset.$id)} className="mt-3 text-red-400 hover:text-red-300 text-sm">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Assets
