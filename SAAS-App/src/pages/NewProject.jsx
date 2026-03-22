import { useState } from 'react'
import { useProjects } from '../context/ProjectsContext'
import { Link, useNavigate } from 'react-router-dom'
import { uploadImage } from '../lib/upload'

const NewProject = () => {
  const { createProject } = useProjects()
  const navigate = useNavigate()
  const [mode, setMode] = useState('text') // 'text' | 'image'
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
  const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  const styles = [
    { value: 'clean', label: 'Clean & Modern' },
    { value: 'bold', label: 'Bold & Dynamic' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'corporate', label: 'Corporate' }
  ]

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Image is too large. Max size is 10MB.')
      return
    }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Image is too large. Max size is 10MB.')
      return
    }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    setFormData({ ...formData, mode: newMode })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'image' && !imageFile) {
      return setError('Please upload an image to continue.')
    }
    if (!formData.title.trim()) {
      return setError('Project title is required.')
    }
    if (mode === 'text' && !formData.description.trim()) {
      return setError('Please add a script/description.')
    }

    setLoading(true)
    try {
      let sourceImageUrl = ''

      if (mode === 'image' && imageFile) {
        sourceImageUrl = await uploadImage(imageFile)
      }

      const project = await createProject({
        title: formData.title,
        description: formData.description,
        style: formData.style,
        mode: mode,
        imageUrl: sourceImageUrl
      })

      navigate(`/projects/${project.$id}`)
    } catch (err) {
      setError('Failed to create project. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-indigo-300 mb-6"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-center text-3xl font-bold tracking-tight text-white">
          New Project
        </h1>
      </div>

      {/* Mode switcher */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 flex gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-sm transition-all shadow-sm ${
              mode === 'text'
                ? 'bg-indigo-500 text-white shadow-indigo-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            <span>✍️</span>
            Text to Video
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-sm transition-all shadow-sm ${
              mode === 'image'
                ? 'bg-indigo-500 text-white shadow-indigo-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/10 border border-white/20'
            }`}
          >
            <span>🖼️</span>
            Image to Video
          </button>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Title — shared */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-100 mb-2"
            >
              Project Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
              placeholder="My promo video"
            />
          </div>

          {/* TEXT MODE fields */}
          {mode === 'text' && (
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-100 mb-2"
              >
                Script / Description
              </label>
              <textarea
                id="description"
                rows={8}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm resize-vertical"
                placeholder="Write your video script here. Describe scenes, what you want to show, tone of voice..."
              />
              <p className="text-gray-500 text-xs mt-2">
                AI will generate visuals and animate based on your script.
              </p>
            </div>
          )}

          {/* IMAGE MODE fields */}
          {mode === 'image' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">
                  Upload Image
                </label>

                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('imageInput').click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all shadow-lg hover:shadow-xl ${
                    imagePreview
                      ? 'border-indigo-500/50 bg-indigo-500/5 shadow-indigo-500/25'
                      : 'border-white/20 bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                  }`}
                >
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="max-h-64 max-w-full rounded-2xl object-contain shadow-2xl"
                      />
                      <div>
                        <p className="text-gray-400 text-xs mb-1">{imageFile?.name}</p>
                        <p className="text-indigo-400 text-sm font-semibold">Click to change image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <span className="text-2xl">🖼️</span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg mb-1">
                          Drop your image here
                        </p>
                        <p className="text-gray-500 text-sm">
                          or click to browse — JPG, PNG, WEBP up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  id="imageInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="motionPrompt"
                  className="block text-sm font-medium text-gray-100 mb-2"
                >
                  Motion Prompt <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  id="motionPrompt"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
                  placeholder="e.g. Slowly orbit clockwise, zoom in dramatically, cinematic pan..."
                />
                <p className="text-gray-500 text-xs mt-2">
                  Describe how the camera should move around your image.
                </p>
              </div>
            </>
          )}

          {/* Style — shared */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-4">
              Video Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map((style) => (
                <label
                  key={style.value}
                  className={`flex items-center justify-center cursor-pointer p-4 rounded-xl border transition-all shadow-sm group ${
                    formData.style === style.value
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-indigo-500/25'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="style"
                    value={style.value}
                    checked={formData.style === style.value}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="sr-only"
                  />
                  <span className={`text-sm font-bold text-center transition-colors ${
                    formData.style === style.value ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-300'
                  }`}>
                    {style.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Link
              to="/dashboard"
              className="flex-1 flex justify-center items-center py-3 px-4 text-sm font-semibold text-gray-400 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex justify-center items-center bg-indigo-500 hover:bg-indigo-600 px-4 py-3 text-sm font-semibold text-white rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (mode === 'image' ? 'Uploading image...' : 'Creating...') : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProject
