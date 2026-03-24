import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { databases, ID } from '../lib/appwrite'
import { submitImageRender, submitRender, pollRender } from '../lib/shotstack'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectsContext'
import { addComment, addAsset, getCollaborators, getComments, listAssets, getScenes, saveCollaborators } from '../lib/collaboration'
import { uploadImage } from '../lib/upload'
import { APPWRITE_DATABASE_ID, APPWRITE_PROJECTS_COLLECTION_ID, APPWRITE_SHARES_COLLECTION_ID } from '../lib/config'

const QUEUE_STAGES = ['Queued', 'Preparing timeline', 'Rendering', 'Finalizing', 'Completed']

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { deleteProject, incrementUserRenders, getUserRendersLeft } = useProjects()

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

  // All user-controlled render options — no presets
  const [titleColor, setTitleColor] = useState('#6366f1')
  const [textColor, setTextColor] = useState('#ffffff')
  const [titleSize, setTitleSize] = useState(58)
  const [textSize, setTextSize] = useState(40)
  const [titleAlign, setTitleAlign] = useState('center')
  const [descriptionAlign, setDescriptionAlign] = useState('center')
  const [textVertical, setTextVertical] = useState('top')
  const [backgroundMode, setBackgroundMode] = useState('none')
  const [backgroundColor, setBackgroundColor] = useState('#0f0f0f')
  const [backgroundAssetType, setBackgroundAssetType] = useState('image')
  const [backgroundAssetUrl, setBackgroundAssetUrl] = useState('')
  const [musicUrl, setMusicUrl] = useState('')

  const [assets, setAssets] = useState([])
  const [assetLoading, setAssetLoading] = useState(false)
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [scenes, setScenes] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [comments, setComments] = useState([])
  const [queueStage, setQueueStage] = useState('Queued')

  const fetchProject = async () => {
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
  }

  useEffect(() => { fetchProject() }, [id, user?.$id])

  useEffect(() => {
    if (project?.status === 'completed' || project?.videoUrl) {
      setQueueStage('Completed')
    } else if (project?.status === 'processing') {
      setQueueStage('Rendering')
    } else {
      setQueueStage('Queued')
    }
  }, [project?.status, project?.videoUrl])

  const derivedScenes = useMemo(() => {
    if (scenes.length > 0) return scenes
    return (project?.description || '')
      .split(/[.!?]+/)
      .map((text, idx) => ({ id: `${idx + 1}`, text: text.trim(), duration: 4 }))
      .filter((scene) => scene.text)
  }, [scenes, project?.description])

  const queueStageIndex = Math.max(0, QUEUE_STAGES.indexOf(queueStage))

  const startPolling = async (renderId) => {
    const interval = setInterval(async () => {
      try {
        const { status, url } = await pollRender(renderId)
        if (status === 'done') {
          clearInterval(interval)
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
          clearInterval(interval)
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
      setGenError('You reached your current render limit. Upgrade from Billing.')
      return
    }
    setGenerating(true)
    setQueueStage('Preparing timeline')
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
          null, // style no longer used
          {
            titleAlign,
            descriptionAlign,
            textVertical,
            backgroundMode,
            backgroundColor,
            backgroundAssetType,
            backgroundAssetUrl,
            musicUrl,
            titleColor,
            textColor,
            titleSize,
            textSize,
          }
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
      const params = new URLSearchParams()
      params.set('exp', String(Date.now() + shareExpiryHours * 3600 * 1000))
      if (disableDownload) params.set('nodl', '1')
      if (sharePassword.trim()) params.set('phash', await hashPassword(sharePassword.trim()))
      const shareUrl = `${window.location.origin}/share/${id}?${params.toString()}`
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
    if (!email) return
    if (collaborators.includes(email)) return
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

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-gray-900/80">
        <Link to="/dashboard">
          <img src="/images/xora.svg" width={120} height={48} alt="Xora" />
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

        {/* Style & Options — text mode only, fully user-controlled */}
        {project.mode === 'text' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <p className="text-gray-400 text-xs uppercase tracking-widest">Style & Options</p>

            {/* Colors */}
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Title Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                  <span className="text-gray-500 text-xs font-mono">{titleColor}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Text Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                  <span className="text-gray-500 text-xs font-mono">{textColor}</span>
                </div>
              </div>
            </div>

            {/* Font sizes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Title Size — {titleSize}px</label>
                <input type="range" min={28} max={96} value={titleSize}
                  onChange={(e) => setTitleSize(Number(e.target.value))}
                  className="accent-indigo-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Text Size — {textSize}px</label>
                <input type="range" min={18} max={72} value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="accent-indigo-500" />
              </div>
            </div>

            {/* Alignment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs">Title Align</label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map((a) => (
                    <button key={a} type="button" onClick={() => setTitleAlign(a)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                        titleAlign === a ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
                      }`}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs">Description Align</label>
                <div className="flex gap-2">
                  {['left', 'center', 'right'].map((a) => (
                    <button key={a} type="button" onClick={() => setDescriptionAlign(a)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                        descriptionAlign === a ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
                      }`}>{a}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs">Vertical Position</label>
                <div className="flex gap-2">
                  {['top', 'center', 'bottom'].map((a) => (
                    <button key={a} type="button" onClick={() => setTextVertical(a)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                        textVertical === a ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
                      }`}>{a}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Background */}
            <div className="flex flex-col gap-3">
              <label className="text-gray-400 text-xs">Background</label>
              <div className="flex gap-3">
                {['none', 'color', 'asset'].map((m) => (
                  <button key={m} type="button" onClick={() => setBackgroundMode(m)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all capitalize ${
                      backgroundMode === m ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
                    }`}>{m}</button>
                ))}
              </div>

              {backgroundMode === 'color' && (
                <div className="flex items-center gap-3">
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                  <span className="text-gray-400 text-sm font-mono">{backgroundColor}</span>
                </div>
              )}

              {backgroundMode === 'asset' && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    {['image', 'video'].map((t) => (
                      <button key={t} type="button" onClick={() => setBackgroundAssetType(t)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all capitalize ${
                          backgroundAssetType === t ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-500/50'
                        }`}>{t}</button>
                    ))}
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:border-indigo-500/50 transition-colors">
                    <span className="text-gray-400 text-sm">{assetLoading ? 'Uploading...' : 'Upload background file'}</span>
                    <input type="file" accept="image/*,video/*" onChange={handleBackgroundUpload} className="hidden" />
                  </label>
                  {assets.length > 0 && (
                    <div>
                      <button type="button" onClick={() => setAssetPickerOpen(!assetPickerOpen)}
                        className="text-indigo-400 text-sm hover:underline">
                        {assetPickerOpen ? 'Hide saved assets' : 'Pick from saved assets'}
                      </button>
                      {assetPickerOpen && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {assets.map((asset) => (
                            <button key={asset.$id} type="button"
                              onClick={() => { setBackgroundAssetUrl(asset.url); setAssetPickerOpen(false) }}
                              className={`rounded-xl overflow-hidden border-2 transition-all ${
                                backgroundAssetUrl === asset.url ? 'border-indigo-500' : 'border-white/10 hover:border-indigo-500/50'
                              }`}>
                              <img src={asset.url} alt={asset.name} className="w-full h-16 object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <input type="text" value={backgroundAssetUrl}
                    onChange={(e) => setBackgroundAssetUrl(e.target.value)}
                    placeholder="Or paste asset URL directly"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              )}
            </div>

            {/* Music */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs">Background Music URL (optional)</label>
              <input type="text" value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)}
                placeholder="https://..."
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>
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

        {/* Video player */}
        {project.videoUrl && (
          <div className="bg-white/5 border border-green-500/20 rounded-2xl p-6">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Generated Video</p>
            <video controls className="w-full rounded-xl" src={project.videoUrl} />
            <div className="flex gap-3 mt-4 flex-wrap">
              <a href={project.videoUrl} download target="_blank" rel="noreferrer"
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                ⬇ Download
              </a>
              <button onClick={handleShare} disabled={shareLoading}
                className="border border-white/10 text-gray-400 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-colors">
                {shareCopied ? '✅ Link Copied!' : shareLoading ? 'Generating...' : '🔗 Share'}
              </button>
            </div>
            {shareError && <p className="text-red-400 text-sm mt-2">{shareError}</p>}

            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs">Expires in</label>
                <select value={shareExpiryHours} onChange={(e) => setShareExpiryHours(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>7 days</option>
                  <option value={720}>30 days</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-xs">Password (optional)</label>
                <input type="text" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="Leave blank for none"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={disableDownload} onChange={(e) => setDisableDownload(e.target.checked)}
                    className="accent-indigo-500" />
                  <span className="text-gray-400 text-sm">Disable download</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Collaborators */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Collaborators</p>
          <p className="text-gray-600 text-xs mb-3">No SMTP configured — invite opens your email client.</p>
          <div className="flex gap-2 mb-4">
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collaborator@email.com"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
            <button onClick={addCollaborator}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              Invite
            </button>
          </div>
          {collaborators.length > 0 && (
            <div className="flex flex-col gap-2">
              {collaborators.map((email) => (
                <div key={email} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                  {email}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-4">Comments</p>
          <div className="flex gap-2 mb-4">
            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors" />
            <button onClick={addProjectComment}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              Post
            </button>
          </div>
          {comments.length > 0 && (
            <div className="flex flex-col gap-3">
              {comments.map((comment) => (
                <div key={comment.$id || comment.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-white text-sm">{comment.text}</p>
                  <p className="text-gray-500 text-xs mt-1">{comment.author}</p>
                </div>
              ))}
            </div>
          )}
        </div>

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
