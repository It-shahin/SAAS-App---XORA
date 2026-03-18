import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { databases } from '../lib/appwrite'
import { useProjects } from '../context/ProjectsContext'

const DATABASE_ID = '69ba0d06002eebdcbb81'
const COLLECTION_ID = 'projects'

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deleteProject } = useProjects()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const result = await databases.getDocument({
          databaseId: DATABASE_ID,
          collectionId: COLLECTION_ID,
          documentId: id
        })
        setProject(result)
      } catch (err) {
        setError('Project not found.')
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProject(id)
      navigate('/dashboard')
    } catch (err) {
      setError('Failed to delete project.')
      setDeleting(false)
    }
  }

  const styleLabels = {
    clean: 'Clean & Modern',
    bold: 'Bold & Dynamic',
    minimal: 'Minimal',
    corporate: 'Corporate'
  }

  if (loading) return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <p className="text-gray-400 text-sm">Loading project...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <Link
          to="/dashboard"
          className="font-semibold text-indigo-400 hover:text-indigo-300 text-sm"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )

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
        
        {/* Project header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Project</p>
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            project.status === 'draft'
              ? 'bg-gray-800/50 text-gray-400 border border-gray-500/30'
              : project.status === 'processing'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl space-y-6">
        {/* Project info card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Script / Description</p>
            <p className="text-gray-100 leading-relaxed whitespace-pre-wrap text-lg">
              {project.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Style</p>
              <p className="text-white font-bold text-lg">
                {styleLabels[project.style] || project.style}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Created</p>
              <p className="text-white font-bold text-lg">
                {new Date(project.$createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Last Updated</p>
              <p className="text-white font-bold text-lg">
                {new Date(project.$updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Generate video card */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-xl mb-2">Ready to generate?</h3>
            <p className="text-gray-300 text-sm">Turn your script into a video using AI. Takes 1–2 minutes.</p>
          </div>
          <button
            disabled
            className="bg-indigo-500/50 text-white font-bold px-8 py-3 rounded-xl opacity-70 cursor-not-allowed whitespace-nowrap text-sm"
          >
            Generate Video — Coming Soon
          </button>
        </div>

        {/* Actions row */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <Link
            to={`/projects/${id}/edit`}
            className="flex-1 flex justify-center items-center py-3 px-6 text-sm font-semibold text-gray-400 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-all"
          >
            ✏️ Edit Project
          </Link>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-1 flex justify-center items-center py-3 px-6 text-sm font-semibold text-red-400 border border-red-500/20 rounded-xl hover:text-red-300 hover:border-red-500/40 transition-all"
            >
              🗑️ Delete Project
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <p className="text-gray-400 text-sm flex-shrink-0">Are you sure?</p>
              <div className="flex gap-2 flex-1">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-gray-400 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-sm font-bold py-2.5 px-4 rounded-xl border border-red-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
