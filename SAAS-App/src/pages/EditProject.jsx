import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { databases } from '../lib/appwrite'
import { useAuth } from '../context/AuthContext'
import { APPWRITE_DATABASE_ID, APPWRITE_PROJECTS_COLLECTION_ID } from '../lib/config'
import { getScenes, saveScenes } from '../lib/collaboration'

const EditProject = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    style: 'clean'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [scenes, setScenes] = useState([])

  const styles = [
    { value: 'clean', label: 'Clean & Modern' },
    { value: 'bold', label: 'Bold & Dynamic' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'corporate', label: 'Corporate' }
  ]

  // Load existing project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const result = await databases.getDocument({
          databaseId: APPWRITE_DATABASE_ID,
          collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
          documentId: id
        })

        if (result.userID !== user?.$id) {
          setError('You do not have access to this project.')
          return
        }

        setFormData({
          title: result.title,
          description: result.description,
          style: result.style || 'clean'
        })

        const savedScenes = await getScenes(id)
        if (savedScenes.length > 0) {
          setScenes(savedScenes)
        } else {
          const derived = result.description
            .split(/[.!?]+/)
            .map((text) => text.trim())
            .filter(Boolean)
            .map((text, index) => ({ id: `${index + 1}`, text, duration: 4 }))
          setScenes(derived)
        }
      } catch {
        setError('Project not found.')
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id, user?.$id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await databases.updateDocument({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
        documentId: id,
        data: {
          title: formData.title.trim(),
          description: (scenes.length > 0
            ? scenes.map((scene) => scene.text.trim()).filter(Boolean).join('. ')
            : formData.description
          ).trim(),
          style: formData.style
        }
      })
      await saveScenes(id, scenes)
      navigate(`/projects/${id}`)
    } catch {
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <p className="text-gray-400 text-sm">Loading project...</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
      {/* Header */}
      <header className="sm:mx-auto sm:w-full sm:max-w-sm mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-indigo-300 mb-4"
        >
          ← Back to dashboard
        </Link>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Editing</p>
          <h1 className="text-3xl font-bold text-white">{formData.title || 'Project'}</h1>
        </div>
      </header>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

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

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-100 mb-2"
            >
              Script / Description
            </label>
            <textarea
              id="description"
              rows={6}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm resize-vertical"
              placeholder="Write your video script here..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-100">Scene Editor</label>
              <button
                type="button"
                onClick={() => setScenes([...scenes, { id: crypto.randomUUID(), text: '', duration: 4 }])}
                className="text-indigo-400 text-xs font-semibold"
              >
                + Add scene
              </button>
            </div>
            <div className="space-y-3">
              {scenes.map((scene, idx) => (
                <div key={scene.id || idx} className="border border-white/10 rounded-xl p-3 bg-white/5">
                  <p className="text-xs text-gray-400 mb-2">Scene {idx + 1}</p>
                  <textarea
                    rows={2}
                    value={scene.text}
                    onChange={(e) => {
                      const next = [...scenes]
                      next[idx] = { ...scene, text: e.target.value }
                      setScenes(next)
                    }}
                    className="block w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={scene.duration}
                      onChange={(e) => {
                        const next = [...scenes]
                        next[idx] = { ...scene, duration: Number(e.target.value || 4) }
                        setScenes(next)
                      }}
                      className="w-24 rounded-md bg-white/5 px-2 py-1 text-xs text-white outline outline-1 outline-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setScenes(scenes.filter((_, i) => i !== idx))}
                      className="text-red-400 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-100 mb-4">
              Video Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map((style) => (
                <label
                  key={style.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.style === style.value
                      ? 'border-indigo-500 bg-indigo-500/10'
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
                  <span className={`text-sm font-semibold ${
                    formData.style === style.value ? 'text-indigo-400' : 'text-gray-400'
                  }`}>
                    {style.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Link
              to={`/projects/${id}`}
              className="flex-1 flex justify-center items-center py-3 px-4 text-sm font-semibold text-gray-400 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex justify-center items-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProject
