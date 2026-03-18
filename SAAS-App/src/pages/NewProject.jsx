import { useState } from 'react'
import { useProjects } from '../context/ProjectsContext'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NewProject = () => {
  const { createProject } = useProjects()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    style: 'clean'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const styles = [
    { value: 'clean', label: 'Clean & Modern' },
    { value: 'bold', label: 'Bold & Dynamic' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'corporate', label: 'Corporate' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createProject(formData)
      navigate('/dashboard')
    } catch (err) {
      setError('Failed to create project. Please try again.')
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

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
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
              rows={8}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm resize-vertical"
              placeholder="Write your video script here. Describe scenes, voiceover, what you want to show..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-100 mb-4">
              Video Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map((style) => (
                <label
                  key={style.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all group ${
                    formData.style === style.value
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/25'
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
                  <span className={`text-sm font-semibold transition-colors ${
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
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProject
