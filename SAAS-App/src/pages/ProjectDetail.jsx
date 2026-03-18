import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { databases, account } from '../lib/appwrite'
import { submitRender, submitImageRender, pollRender } from '../lib/shotstack'
import { useProjects, FREE_PLAN_LIMIT } from '../context/ProjectsContext'

const DATABASE_ID = '69ba0d06002eebdcbb81'
const COLLECTION_ID = 'projects'

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  // ← fixed: destructure incrementUserRenders, not updateProjectRenders
  const { deleteProject, incrementUserRenders } = useProjects()

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

  useEffect(() => { fetchProject() }, [id])

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
          await incrementUserRenders()  // ← now properly destructured above
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
      } catch (err) {
        clearInterval(interval)
        setGenError('Error checking render status.')
        setGenerating(false)
      }
    }, 4000)
  }

  const handleGenerate = async () => {
    setGenError('')
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
        renderId = await submitRender(
          project.title,
          project.description,
          project.style || 'clean'
        )
      }

      await databases.updateDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: id,
        data: { renderID: renderId }
      })

      startPolling(renderId)
    } catch (err) {
      setGenError(err.message || 'Failed to start generation.')
      setGenerating(false)
    }
  }

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
    <div className="min-h-screen bg-s1 flex items-center justify-center">
      <p className="text-p3">Loading project...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-s1 flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">{error}</p>
      <Link to="/dashboard" className="text-p1 hover:underline">← Back to dashboard</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-s1 text-white">

      {/* Header */}
      <header className="border-b border-s3/20 px-8 py-4 flex items-center justify-between">
        <Link to="/">
          <img src="/images/xora.svg" width={100} height={40} alt="logo" />
        </Link>
        <Link to="/dashboard" className="text-p3 text-sm hover:text-p1 transition-colors">
          ← Dashboard
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-12">

        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-p3 text-xs uppercase tracking-widest mb-2">Project</p>
            <h1 className="text-4xl font-bold">{project.title}</h1>
          </div>
          <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${
            project.status === 'draft' ? 'bg-s3/20 text-p3'
            : project.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400'
            : project.status === 'completed' ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
          }`}>
            {project.status}
          </span>
        </div>

        {/* Project info */}
        <div className="bg-s2 border border-s3/20 rounded-2xl p-8 flex flex-col gap-6 mb-6">
          <div>
            <p className="text-p3 text-xs uppercase tracking-widest mb-2">Script / Description</p>
            <p className="text-white leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
            <div>
              <p className="text-p3 text-xs uppercase tracking-widest mb-2">Style</p>
              <p className="text-white font-bold">{styleLabels[project.style] || project.style || '—'}</p>
            </div>
            <div>
              <p className="text-p3 text-xs uppercase tracking-widest mb-2">Created</p>
              <p className="text-white font-bold">
                {new Date(project.$createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Video player */}
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
                ⬇ Download Video
              </a>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="text-p3 text-sm hover:text-p1 border border-s3/20 px-5 py-2.5 rounded-xl transition-colors"
              >
                🔄 Regenerate
              </button>
            </div>
          </div>
        )}

        {/* Generate card */}
        {project.status !== 'completed' && (
          <div className="bg-p1/10 border border-p1/30 rounded-2xl p-8 mb-6">
            {genError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">{genError}</p>
              </div>
            )}

            {project.status === 'processing' || generating ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="size-12 border-4 border-p1/30 border-t-p1 rounded-full animate-spin" />
                <p className="text-white font-bold">Generating your video...</p>
                <p className="text-p3 text-sm">This takes 1–2 minutes. You can leave and come back.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Ready to generate?</h3>
                  <p className="text-p3 text-sm">Turn your script into a video using AI. Takes 1–2 minutes.</p>
                </div>
                <button
                  onClick={handleGenerate}
                  className="bg-p1 hover:bg-p1/80 text-white font-bold px-8 py-3 rounded-xl whitespace-nowrap transition-colors"
                >
                  ✨ Generate Video
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <Link
            to={`/projects/${id}/edit`}
            className="text-p3 text-sm hover:text-p1 transition-colors border border-s3/20 px-5 py-2.5 rounded-xl"
          >
            ✏️ Edit Project
          </Link>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-red-400 text-sm hover:text-red-300 transition-colors border border-red-500/20 px-5 py-2.5 rounded-xl"
            >
              🗑 Delete Project
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-p3 text-sm">Are you sure?</p>
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
