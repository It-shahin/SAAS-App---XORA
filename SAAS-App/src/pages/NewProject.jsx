import { useEffect, useState } from 'react'
import { useProjects } from '../context/ProjectsContext'
import { Link, useNavigate } from 'react-router-dom'
import { uploadImage } from '../lib/upload'
import { listAssets } from '../lib/collaboration'

const STYLES = [
  { id: 'clean', label: 'Clean', desc: 'Light & modern' },
  { id: 'bold', label: 'Bold', desc: 'High contrast purple' },
  { id: 'minimal', label: 'Minimal', desc: 'Simple & elegant' },
  { id: 'corporate', label: 'Corporate', desc: 'Professional blue' },
]

const NewProject = () => {
  const { createProject } = useProjects()
  const navigate = useNavigate()
  const [mode, setMode] = useState('text')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    style: 'clean',
    mode: 'text',
    imageUrl: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedAssets, setSavedAssets] = useState([])

  const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  useEffect(() => {
    listAssets().then((docs) =>
      setSavedAssets(docs.map((doc) => ({ id: doc.$id, name: doc.name, url: doc.url })))
    )
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) return setError('Please upload a JPG, PNG, or WEBP image.')
    if (file.size > MAX_IMAGE_SIZE_BYTES) return setError('Image is too large. Max size is 10MB.')
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFormData((prev) => ({ ...prev, imageUrl: '' }))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) return setError('Please upload a JPG, PNG, or WEBP image.')
    if (file.size > MAX_IMAGE_SIZE_BYTES) return setError('Image is too large. Max size is 10MB.')
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFormData((prev) => ({ ...prev, imageUrl: '' }))
  }

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setFormData((prev) => ({ ...prev, mode: newMode }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.title.trim()) return setError('Project title is required.')
    if (mode === 'text' && !formData.description.trim()) return setError('Please add a script/description.')
    if (mode === 'image' && !imageFile && !formData.imageUrl) return setError('Please upload or select an image.')
    setLoading(true)
    try {
      let sourceImageUrl = formData.imageUrl || ''
      if (mode === 'image' && !sourceImageUrl && imageFile) {
        sourceImageUrl = await uploadImage(imageFile)
      }
      const project = await createProject({
        title: formData.title,
        description: formData.description,
        style: formData.style || 'clean',  // ← fixed
        mode,
        imageUrl: sourceImageUrl
      })
      navigate(`/projects/${project.$id}`)
    } catch {
      setError('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-gray-900/80">
        <Link to="/dashboard">
          <img src="/images/xora.svg" width={120} height={48} alt="Xora" />
        </Link>
        <Link to="/dashboard" className="text-gray-400 text-sm hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">New Project</h1>
        <p className="text-gray-400 mb-10">Configure your video and click Create.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* Mode toggle */}
          <div className="flex gap-3">
            {['text', 'image'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeSwitch(m)}
                className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all capitalize ${
                  mode === m
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
                }`}
              >
                {m === 'text' ? '✏️ Text to Video' : '🖼️ Image to Video'}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-xs uppercase tracking-widest">Project Title</label>
            <input
              type="text"
              placeholder="e.g. BMW M3 Promo"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Description / Script (text mode only) */}
          {mode === 'text' && (
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs uppercase tracking-widest">Script / Description</label>
              <textarea
                rows={5}
                placeholder="Write your video script here. Each sentence becomes a scene."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          )}

          {/* Image upload (image mode only) */}
          {mode === 'image' && (
            <div className="flex flex-col gap-4">
              <label className="text-gray-400 text-xs uppercase tracking-widest">Source Image</label>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('imageInput').click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                ) : (
                  <>
                    <p className="text-gray-400 mb-2">Drag & drop or click to upload</p>
                    <p className="text-gray-600 text-xs">JPG, PNG, WEBP — max 10MB</p>
                  </>
                )}
              </div>
              <input
                id="imageInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Saved assets picker */}
              {savedAssets.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-gray-400 text-xs uppercase tracking-widest">Or pick from saved assets</p>
                  <div className="grid grid-cols-3 gap-3">
                    {savedAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, imageUrl: asset.url }))
                          setImagePreview(asset.url)
                          setImageFile(null)
                        }}
                        className={`rounded-xl overflow-hidden border-2 transition-all ${
                          formData.imageUrl === asset.url ? 'border-indigo-500' : 'border-white/10 hover:border-indigo-500/50'
                        }`}
                      >
                        <img src={asset.url} alt={asset.name} className="w-full h-20 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ← Style selector (fixed) */}
          {mode === 'text' && (
            <div className="flex flex-col gap-3">
              <label className="text-gray-400 text-xs uppercase tracking-widest">Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, style: s.id }))}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl text-sm border transition-all ${
                      formData.style === s.id
                        ? 'bg-indigo-500/20 border-indigo-500 text-white'
                        : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
                    }`}
                  >
                    <span className="font-bold capitalize">{s.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl transition-colors"
          >
            {loading ? 'Creating...' : 'Create Project →'}
          </button>

        </form>
      </div>
    </div>
  )
}

export default NewProject
