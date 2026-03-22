import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { databases } from '../lib/appwrite'
import { submitRender, submitImageRender, pollRender } from '../lib/shotstack'
import { useProjects } from '../context/ProjectsContext'
import { useAuth } from '../context/AuthContext'

const DATABASE_ID = '69ba0d06002eebdcbb81'
const COLLECTION_ID = 'projects'

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  const { deleteProject, incrementUserRenders, getUserRendersLeft } = useProjects()

  const fetchProject = async () => {
    if (!user) return

    try {
      const result = await databases.getDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: id
      })

      if (result.userID !== user.$id) {
        setError('You do not have access to this project.')
        return
      }

      setProject(result)
      setError('')
    } catch {
      setError('Project not found.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [id, user?.$id])

  const startPolling = async (renderId) => {
    const interval = setInterval(async () => {
      try {
        const { status, url } = await pollRender(renderId)

        if (status === 'done') {
          clearInterval(interval)
          await databases.updateDocument({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            documentId: id,
            data: { status: 'completed', videoUrl: url }
          })
          await incrementUserRenders()
          await fetchProject()
          setGenerating(false)
        }

        if (status === 'failed') {
          clearInterval(interval)
          await databases.updateDocument({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            documentId: id,
            data: { status: 'draft' }
          })
          setGenError('Render failed. Please try again.')
          setGenerating(false)
        }
      } catch {
        clearInterval(interval)
        setGenError('Error checking render status.')
        setGenerating(false)
      }
    }, 4000)
  }

  const handleGenerate = async () => {
    setGenError('')

    const rendersLeft = await getUserRendersLeft()
    if (rendersLeft <= 0) {
      setGenError('You reached your free render limit. Please upgrade to continue.')
      return
    }

    setGenerating(true)
    try {
      await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: id,
        data: { status: 'processing' }
      })
      await fetchProject()

      let renderId
      if (project.mode === 'image') {
        renderId = await submitImageRender(
          project.sourceImageUrl,
          project.description || 'Cinematic slow camera movement'
        )
      } else {
        renderId = await submitRender(project.title, project.description, project.style || 'clean')
      }

      await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: id,
        data: { renderID: renderId }
      })

      startPolling(renderId)
    } catch {
      setGenError('Failed to start generation. Please try again.')
      setGenerating(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProject(id)
      navigate('/dashboard')
    } catch {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-s1 flex items-center justify-center">
        <p className="text-p3">Loading project...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-s1 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || 'Project not found.'}</p>
        <Link to="/dashboard" className="text-p1 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-s1 text-white">
      <header className="border-b border-s3/20 px-8 py-4 flex items-center justify-between">
        <Link to="/">
          <img src="/images/xora.svg" width={100} height={40} alt="Trimix AI" />
        </Link>
        <Link to="/dashboard" className="text-p3 text-sm hover:text-p1 transition-colors">
          Dashboard
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-p3 text-xs uppercase tracking-widest mb-2">Project</p>
            <h1 className="text-4xl font-bold">{project.title}</h1>
          </div>
          <span
            className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${
              project.status === 'draft'
                ? 'bg-s3/20 text-p3'
                : project.status === 'processing'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : project.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
            }`}
          >
            {project.status}
          </span>
        </div>

        <div className="bg-s2 border border-s3/20 rounded-2xl p-8 flex flex-col gap-6 mb-6">
          <div>
            <p className="text-p3 text-xs uppercase tracking-widest mb-2">Script / Description</p>
            <p className="text-white leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
            <div>
              <p className="text-p3 text-xs uppercase tracking-widest mb-2">Style</p>
              <p className="text-white font-bold">{styleLabels[project.style] || project.style || '-'}</p>
            </div>
          </div>
        </div>

        {project.status === 'completed' && project.videoUrl && (
          <div className="bg-s2 border border-green-500/20 rounded-2xl p-6 mb-6">
            <p className="text-p3 text-xs uppercase tracking-widest mb-4">Generated Video</p>
            <video controls className="w-full rounded-xl" src={project.videoUrl} />
            <div className="flex gap-4 mt-4">
              <a
                href={project.videoUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="bg-p1 hover:bg-p1/80 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                Download Video
              </a>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="text-p3 text-sm hover:text-p1 border border-s3/20 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        )}

        {project.status !== 'completed' && (
          <div className="bg-p1/10 border border-p1/30 rounded-2xl p-8 mb-6">
            {genError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">{genError}</p>
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating || project.status === 'processing'}
              className="bg-p1 hover:bg-p1/80 text-white font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generating || project.status === 'processing' ? 'Generating...' : 'Generate Video'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link
            to={`/projects/${id}/edit`}
            className="text-p3 text-sm hover:text-p1 transition-colors border border-s3/20 px-5 py-2.5 rounded-xl"
          >
            Edit Project
          </Link>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-red-400 text-sm hover:text-red-300 transition-colors border border-red-500/20 px-5 py-2.5 rounded-xl"
            >
              Delete Project
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-p3 text-sm hover:text-p1 px-4 py-2 rounded-xl border border-s3/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 text-sm font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
