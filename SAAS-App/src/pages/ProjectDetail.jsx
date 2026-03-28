import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { databases, ID } from '../lib/appwrite'
import { submitImageRender, submitRender, pollRender } from '../lib/shotstack'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectsContext'
import { addComment, addAsset, getCollaborators, getComments, listAssets, getScenes, saveCollaborators } from '../lib/collaboration'
import { uploadImage } from '../lib/upload'
import { APPWRITE_DATABASE_ID, APPWRITE_PROJECTS_COLLECTION_ID, APPWRITE_SHARES_COLLECTION_ID } from '../lib/config'
import StyleOptions from '../components/project/StyleOptions'
import SharePanel from '../components/project/SharePanel'
import CollaboratorsPanel from '../components/project/CollaboratorsPanel'
import CommentsPanel from '../components/project/CommentsPanel'

const QUEUE_STAGES = ['Queued', 'Preparing timeline', 'Rendering', 'Finalizing', 'Completed']
const CAPTION_REFERENCE = 'A young man dancing with confidence in a modern'

// Default render options — used as fallback when no saved options exist
const DEFAULT_OPTIONS = {
  titleColor: '#6366f1',
  textColor: '#ffffff',
  titleSize: 58,
  textSize: 40,
  titleAlign: 'center',
  descriptionAlign: 'center',
  textVertical: 'top',
  backgroundMode: 'none',
  backgroundColor: '#0f0f0f',
  backgroundAssetType: 'image',
  backgroundAssetUrl: '',
  musicUrl: '',
}

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { deleteProject, incrementUserRenders, getUserRendersLeft } = useProjects()
  const pollingRef = useRef(null)
  const saveOptionsTimerRef = useRef(null)

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  const [shareLoading, setShareLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareError, setShareError] = useState('')
  const [shareExpiryHours, setShareExpiryHours] = useState(72)
  const [sharePassword, setSharePassword] = useState('')
  const [disableDownload, setDisableDownload] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [commentText, setCommentText] = useState('')

  // Render style options — initialized from defaults, overwritten from DB on load
  const [titleColor, setTitleColor] = useState(DEFAULT_OPTIONS.titleColor)
  const [textColor, setTextColor] = useState(DEFAULT_OPTIONS.textColor)
  const [titleSize, setTitleSize] = useState(DEFAULT_OPTIONS.titleSize)
  const [textSize, setTextSize] = useState(DEFAULT_OPTIONS.textSize)
  const [titleAlign, setTitleAlign] = useState(DEFAULT_OPTIONS.titleAlign)
  const [descriptionAlign, setDescriptionAlign] = useState(DEFAULT_OPTIONS.descriptionAlign)
  const [textVertical, setTextVertical] = useState(DEFAULT_OPTIONS.textVertical)
  const [backgroundMode, setBackgroundMode] = useState(DEFAULT_OPTIONS.backgroundMode)
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_OPTIONS.backgroundColor)
  const [backgroundAssetType, setBackgroundAssetType] = useState(DEFAULT_OPTIONS.backgroundAssetType)
  const [backgroundAssetUrl, setBackgroundAssetUrl] = useState(DEFAULT_OPTIONS.backgroundAssetUrl)
  const [musicUrl, setMusicUrl] = useState(DEFAULT_OPTIONS.musicUrl)

  const [assets, setAssets] = useState([])
  const [assetLoading, setAssetLoading] = useState(false)
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [scenes, setScenes] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [comments, setComments] = useState([])
  const [queueStage, setQueueStage] = useState('Queued')

  // Build current options object from state
  const getCurrentOptions = useCallback(() => ({
    titleColor, textColor, titleSize, textSize,
    titleAlign, descriptionAlign, textVertical,
    backgroundMode, backgroundColor, backgroundAssetType,
    backgroundAssetUrl, musicUrl,
  }), [
    titleColor, textColor, titleSize, textSize,
    titleAlign, descriptionAlign, textVertical,
    backgroundMode, backgroundColor, backgroundAssetType,
    backgroundAssetUrl, musicUrl,
  ])

  // Apply saved options from DB onto state
  const applyOptions = useCallback((opts) => {
    if (!opts || typeof opts !== 'object') return
    if (opts.titleColor)         setTitleColor(opts.titleColor)
    if (opts.textColor)          setTextColor(opts.textColor)
    if (opts.titleSize)          setTitleSize(Number(opts.titleSize))
    if (opts.textSize)           setTextSize(Number(opts.textSize))
    if (opts.titleAlign)         setTitleAlign(opts.titleAlign)
    if (opts.descriptionAlign)   setDescriptionAlign(opts.descriptionAlign)
    if (opts.textVertical)       setTextVertical(opts.textVertical)
    if (opts.backgroundMode)     setBackgroundMode(opts.backgroundMode)
    if (opts.backgroundColor)    setBackgroundColor(opts.backgroundColor)
    if (opts.backgroundAssetType) setBackgroundAssetType(opts.backgroundAssetType)
    if (opts.backgroundAssetUrl !== undefined) setBackgroundAssetUrl(opts.backgroundAssetUrl)
    if (opts.musicUrl !== undefined)           setMusicUrl(opts.musicUrl)
  }, [])

  const fetchProject = useCallback(async () => {
    if (!user) return
    try {
      const result = await databases.getDocument({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
        documentId: id
      })
      if (result.userID !== user.$id) {
        setError('You do not have access to this project.')
        return
      }
      setProject(result)

      // Restore user's saved render options from DB if they exist
      if (result.renderOptions) {
        try {
          applyOptions(JSON.parse(result.renderOptions))
        } catch {
          // renderOptions field is malformed — keep defaults
        }
      }

      setScenes(await getScenes(id))
      setCollaborators(await getCollaborators(id))
      setComments(await getComments(id))
      setAssets(await listAssets())
      setError('')
    } catch {
      setError('Project not found.')
    } finally {
      setLoading(false)
    }
  }, [id, user, applyOptions])

  useEffect(() => { fetchProject() }, [fetchProject])

  // Clear polling interval and pending save timer on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (saveOptionsTimerRef.current) clearTimeout(saveOptionsTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (project?.status === 'completed' || project?.videoUrl) {
      setQueueStage('Completed')
    } else if (project?.status === 'processing') {
      setQueueStage('Rendering')
    } else {
      setQueueStage('Queued')
    }
  }, [project?.status, project?.videoUrl])

  // Auto-save render options to DB 800ms after user stops changing them
  useEffect(() => {
    if (!project) return
    if (saveOptionsTimerRef.current) clearTimeout(saveOptionsTimerRef.current)
    saveOptionsTimerRef.current = setTimeout(async () => {
      try {
        await databases.updateDocument({
          databaseId: APPWRITE_DATABASE_ID,
          collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
          documentId: id,
          data: { renderOptions: JSON.stringify(getCurrentOptions()) }
        })
      } catch {
        // Silently fail — options will be re-applied next time via state anyway
      }
    }, 800)
    return () => {
      if (saveOptionsTimerRef.current) clearTimeout(saveOptionsTimerRef.current)
    }
  }, [
    getCurrentOptions,
    id,
    project,
    titleColor, textColor, titleSize, textSize,
    titleAlign, descriptionAlign, textVertical,
    backgroundMode, backgroundColor, backgroundAssetType,
    backgroundAssetUrl, musicUrl,
  ])

  const derivedScenes = useMemo(() => {
    if (scenes.length > 0) return scenes
    return (project?.description || '')
      .split(/[.!?]+/)
      .map((text, idx) => ({ id: `${idx + 1}`, text: text.trim(), duration: 4 }))
      .filter((scene) => scene.text)
  }, [scenes, project?.description])

  const queueStageIndex = Math.max(0, QUEUE_STAGES.indexOf(queueStage))

  const buildSubtitleBlocks = (text, fontSize) => {
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
    if (words.length === 0) return []
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return []
    ctx.font = `600 ${fontSize}px Open Sans, Arial, sans-serif`
    const maxWidth = ctx.measureText(CAPTION_REFERENCE).width

    const lines = []
    let current = ''
    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (ctx.measureText(next).width <= maxWidth) {
        current = next
      } else {
        if (current) lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)

    const blocks = []
    for (let i = 0; i < lines.length; i += 2) {
      blocks.push(lines.slice(i, i + 2))
      if (blocks.length >= 8) break
    }
    return blocks
  }

  const startPolling = (renderId) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const { status, url } = await pollRender(renderId)
        if (status === 'done') {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          await databases.updateDocument({
            databaseId: APPWRITE_DATABASE_ID,
            collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
            documentId: id,
            data: { status: 'completed', videoUrl: url }
          })
          await incrementUserRenders()
          await fetchProject()
          setGenerating(false)
          setQueueStage('Completed')
        } else if (status === 'failed') {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          await databases.updateDocument({
            databaseId: APPWRITE_DATABASE_ID,
            collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
            documentId: id,
            data: { status: 'draft' }
          })
          setGenError('Render failed. Please try again.')
          setGenerating(false)
          setQueueStage('Queued')
        } else {
          setQueueStage('Rendering')
        }
      } catch {
        clearInterval(pollingRef.current)
        pollingRef.current = null
        setGenError('Error checking render status.')
        setGenerating(false)
      }
    }, 4000)
  }

  const handleGenerate = async () => {
    setGenError('')
    const rendersLeft = await getUserRendersLeft()
    if (rendersLeft <= 0) {
      setGenError('You reached your current render limit. Upgrade from Billing.')
      return
    }
    setGenerating(true)
    setQueueStage('Preparing timeline')

    // Always use the latest options from state — these are what the user configured
    const renderOptions = getCurrentOptions()

    try {
      await databases.updateDocument({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
        documentId: id,
        data: { status: 'processing' }
      })
      const timelineText = derivedScenes.map((s) => s.text).join('. ')
      let renderId
      if (project.mode === 'image') {
        renderId = await submitImageRender(
          project.sourceImageUrl,
          timelineText || 'Cinematic slow camera movement'
        )
      } else {
        renderId = await submitRender(
          project.title,
          timelineText || project.description,
          { ...renderOptions, subtitleBlocks: buildSubtitleBlocks(timelineText || project.description, textSize) }
        )
      }
      setQueueStage('Rendering')
      await databases.updateDocument({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
        documentId: id,
        data: { renderID: renderId }
      })
      await fetchProject()
      startPolling(renderId)
    } catch {
      setGenError('Failed to start generation. Please try again.')
      setGenerating(false)
      setQueueStage('Queued')
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

  const copyToClipboard = async (text) => {
    if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text)
    const input = document.createElement('input')
    input.value = text
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }

  const hashPassword = async (text) => {
    const data = new TextEncoder().encode(text)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  const handleShare = async () => {
    if (!project?.videoUrl) return setShareError('Video is not ready yet.')
    setShareError('')
    setShareLoading(true)
    try {
      const payload = {
        projectId: id,
        title: project.title,
        videoUrl: project.videoUrl,
        metadata: JSON.stringify({
          access: {
            exp: Date.now() + shareExpiryHours * 3600 * 1000,
            nodl: disableDownload,
            phash: sharePassword.trim() ? await hashPassword(sharePassword.trim()) : ''
          },
          scenes: derivedScenes,
          comments: comments.map((c) => ({ id: c.$id || c.id, text: c.text, author: c.author }))
        })
      }
      try {
        await databases.updateDocument({
          databaseId: APPWRITE_DATABASE_ID,
          collectionId: APPWRITE_SHARES_COLLECTION_ID,
          documentId: id,
          data: payload
        })
      } catch {
        await databases.createDocument({
          databaseId: APPWRITE_DATABASE_ID,
          collectionId: APPWRITE_SHARES_COLLECTION_ID,
          documentId: id || ID.unique(),
          data: payload
        })
      }
      const shareUrl = `${window.location.origin}/share/${id}`
      await copyToClipboard(shareUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 3000)
    } catch {
      setShareError('Could not create share link. Please try again.')
    } finally {
      setShareLoading(false)
    }
  }

  const addCollaborator = async () => {
    const email = inviteEmail.trim().toLowerCase()
    if (!email || collaborators.includes(email)) return
    const next = [...collaborators, email]
    await saveCollaborators(id, next)
    setCollaborators(next)
    setInviteEmail('')
    const inviteLink = `${window.location.origin}/share/${id}`
    window.open(`mailto:${email}?subject=Trimix AI Collaboration Invite&body=You were invited to collaborate: ${inviteLink}`)
  }

  const addProjectComment = async () => {
    const text = commentText.trim()
    if (!text) return
    await addComment(id, text, user?.email || 'owner')
    setCommentText('')
    setComments(await getComments(id))
  }

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAssetLoading(true)
    try {
      const url = await uploadImage(file)
      await addAsset(file.name, url)
      const nextAssets = await listAssets()
      setAssets(nextAssets)
      setBackgroundMode('asset')
      setBackgroundAssetType(file.type.startsWith('video/') ? 'video' : 'image')
      setBackgroundAssetUrl(url)
    } catch {
      setGenError('Failed to upload background asset.')
    } finally {
      setAssetLoading(false)
      e.target.value = ''
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="size-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  if (error || !project) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-red-400 text-lg">{error || 'Project not found.'}</p>
      <Link to="/dashboard" className="text-indigo-400 hover:underline text-sm">← Back to dashboard</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">

      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-gray-900/80">
        <Link to="/dashboard">
          <img src="/images/logo-trimmixai-nobg.png" width={178} height={48} alt="Trimix AI" />
        </Link>
        <Link to="/dashboard" className="text-gray-400 text-sm hover:text-white transition-colors">
          ← Dashboard
        </Link>
      </header>

      <div className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-10">

        {/* Title + status */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Project</p>
            <h1 className="text-3xl font-bold">{project.title}</h1>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            project.status === 'completed'
              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              : project.status === 'processing'
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-gray-800/50 text-gray-400 border-gray-500/30'
          }`}>
            {project.status}
          </span>
        </div>

        {/* Render Queue */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Render Queue</p>
          <div className="flex items-center gap-2 flex-wrap">
            {QUEUE_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  i < queueStageIndex
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : i === queueStageIndex
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-gray-500'
                }`}>
                  {i < queueStageIndex && <span>✓</span>}
                  {stage}
                </div>
                {i < QUEUE_STAGES.length - 1 && (
                  <div className={`w-4 h-0.5 ${i < queueStageIndex ? 'bg-indigo-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scenes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Scenes</p>
          <div className="flex flex-col gap-3">
            {derivedScenes.map((scene, idx) => (
              <div key={scene.id || idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-gray-500 text-xs mb-1">Scene {idx + 1} • {scene.duration || 4}s</p>
                <p className="text-white text-sm">{scene.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Style Options — text mode only */}
        {project.mode === 'text' && (
          <StyleOptions
            titleColor={titleColor} setTitleColor={setTitleColor}
            textColor={textColor} setTextColor={setTextColor}
            titleSize={titleSize} setTitleSize={setTitleSize}
            textSize={textSize} setTextSize={setTextSize}
            titleAlign={titleAlign} setTitleAlign={setTitleAlign}
            descriptionAlign={descriptionAlign} setDescriptionAlign={setDescriptionAlign}
            textVertical={textVertical} setTextVertical={setTextVertical}
            backgroundMode={backgroundMode} setBackgroundMode={setBackgroundMode}
            backgroundColor={backgroundColor} setBackgroundColor={setBackgroundColor}
            backgroundAssetType={backgroundAssetType} setBackgroundAssetType={setBackgroundAssetType}
            backgroundAssetUrl={backgroundAssetUrl} setBackgroundAssetUrl={setBackgroundAssetUrl}
            musicUrl={musicUrl} setMusicUrl={setMusicUrl}
            assets={assets}
            assetLoading={assetLoading}
            assetPickerOpen={assetPickerOpen} setAssetPickerOpen={setAssetPickerOpen}
            handleBackgroundUpload={handleBackgroundUpload}
          />
        )}

        {/* Generate */}
        {genError && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{genError}</p>
        )}
        <button onClick={handleGenerate} disabled={generating || project.status === 'processing'}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl transition-colors">
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {queueStage}...
            </span>
          ) : project.status === 'completed' ? '🔄 Regenerate Video' : '✨ Generate Video'}
        </button>

        {/* Video player + Share */}
        {project.videoUrl && (
          <SharePanel
            videoUrl={project.videoUrl}
            shareLoading={shareLoading}
            shareCopied={shareCopied}
            shareError={shareError}
            shareExpiryHours={shareExpiryHours} setShareExpiryHours={setShareExpiryHours}
            sharePassword={sharePassword} setSharePassword={setSharePassword}
            disableDownload={disableDownload} setDisableDownload={setDisableDownload}
            handleShare={handleShare}
          />
        )}

        {/* Collaborators */}
        <CollaboratorsPanel
          collaborators={collaborators}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          addCollaborator={addCollaborator}
        />

        {/* Comments */}
        <CommentsPanel
          comments={comments}
          commentText={commentText}
          setCommentText={setCommentText}
          addProjectComment={addProjectComment}
        />

        {/* Danger zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Danger Zone</p>
          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)}
              className="text-red-400 border border-red-500/30 hover:bg-red-500/10 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
              🗑 Delete Project
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-gray-300 text-sm">Are you sure? This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="border border-white/10 text-gray-400 px-5 py-2.5 rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
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
