import { useEffect, useState } from 'react'
import { useProjects } from '../context/ProjectsContext'
import { Link, useNavigate } from 'react-router-dom'
import { uploadImage } from '../lib/upload'
import { listAssets } from '../lib/collaboration'

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
    listAssets().then((docs) => setSavedAssets(docs.map((doc) => ({ id: doc.$id, name: doc.name, url: doc.url }))))
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
        style: formData.style || 'clean',
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
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-8">
        <Link to="/dashboard" className="inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-indigo-300 mb-6">
          Back to dashboard
        </Link>
        <h1 className="text-center text-3xl font-bold tracking-tight text-white">New Project</h1>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 flex gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch('text')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold text-sm ${mode === 'text' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            Text to Video
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('image')}
            className={`flex-1 py-4 px-6 rounded-xl font-bold text-sm ${mode === 'image' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            Image to Video
          </button>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-100 mb-2">Project Title</label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10"
              placeholder="My promo video"
            />
          </div>

          {mode === 'text' && (
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-100 mb-2">Script / Description</label>
              <textarea
                id="description"
                rows={8}
                required
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 resize-vertical"
                placeholder="Write your video script here..."
              />
            </div>
          )}

          {mode === 'image' && (
            <>
              {savedAssets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-100 mb-2">Use from Asset Library</label>
                  <select
                    className="block w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10"
                    defaultValue=""
                    onChange={(e) => {
                      const chosen = savedAssets.find((a) => a.id === e.target.value)
                      if (chosen) {
                        setImageFile(null)
                        setImagePreview(chosen.url)
                        setFormData((prev) => ({ ...prev, imageUrl: chosen.url }))
                      }
                    }}
                  >
                    <option value="">Select an existing asset...</option>
                    {savedAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>{asset.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Upload Image</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('imageInput').click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer ${imagePreview ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/20 bg-white/5 hover:border-indigo-500/50'}`}
                >
                  {imagePreview ? <img src={imagePreview} alt="preview" className="max-h-64 max-w-full rounded-2xl object-contain mx-auto" /> : <p className="text-gray-400">Drop image here or click to browse</p>}
                </div>
                <input id="imageInput" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              </div>

              <div>
                <label htmlFor="motionPrompt" className="block text-sm font-medium text-gray-100 mb-2">Motion Prompt (optional)</label>
                <input
                  id="motionPrompt"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10"
                  placeholder="e.g. slow cinematic pan"
                />
              </div>
            </>
          )}

          <div className="flex gap-4 pt-6">
            <Link to="/dashboard" className="flex-1 flex justify-center items-center py-3 px-4 text-sm font-semibold text-gray-400 border border-white/10 rounded-xl">Cancel</Link>
            <button type="submit" disabled={loading} className="flex-1 flex justify-center items-center bg-indigo-500 hover:bg-indigo-600 px-4 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-60">
              {loading ? (mode === 'image' ? 'Uploading image...' : 'Creating...') : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProject

