import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { databases, ID } from '../lib/appwrite'
import { submitImageRender, submitRender, pollRender } from '../lib/shotstack'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectsContext'
import {
  addComment,
  addAsset,
  getCollaborators,
  getComments,
  listAssets,
  getScenes,
  saveCollaborators
} from '../lib/collaboration'
import { uploadImage } from '../lib/upload'
import {
  APPWRITE_DATABASE_ID,
  APPWRITE_PROJECTS_COLLECTION_ID,
  APPWRITE_SHARES_COLLECTION_ID
} from '../lib/config'

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
  const [titleAlign, setTitleAlign] = useState('center')
  const [descriptionAlign, setDescriptionAlign] = useState('center')
  const [textVertical, setTextVertical] = useState('top')
  const [backgroundMode, setBackgroundMode] = useState('none')
  const [backgroundColor, setBackgroundColor] = useState('#0f0f0f')
  const [backgroundAssetType, setBackgroundAssetType] = useState('image')
  const [backgroundAssetUrl, setBackgroundAssetUrl] = useState('')
  const [renderStyle, setRenderStyle] = useState('clean')
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
      setRenderStyle(result.style || 'clean')
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

  useEffect(() => {
    fetchProject()
  }, [id, user?.$id])

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

      const timelineText = derivedScenes.map((scene) => scene.text).join('. ')
      let renderId
      if (project.mode === 'image') {
        renderId = await submitImageRender(project.sourceImageUrl, timelineText || 'Cinematic slow camera movement')
      } else {
        renderId = await submitRender(project.title, timelineText || project.description, renderStyle || 'clean', {
          titleAlign,
          descriptionAlign,
          textVertical,
          backgroundMode,
          backgroundColor,
          backgroundAssetType,
          backgroundAssetUrl,
          musicUrl
        })
      }

      setQueueStage('Rendering')
      await databases.updateDocument({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
        documentId: id,
        data: { style: renderStyle }
      })
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

  if (loading) return <div className="min-h-screen bg-s1 flex items-center justify-center"><p className="text-p3">Loading project...</p></div>
  if (error || !project) return <div className="min-h-screen bg-s1 flex flex-col items-center justify-center gap-4"><p className="text-red-400">{error || 'Project not found.'}</p><Link to="/dashboard" className="text-p1 hover:underline">Back to dashboard</Link></div>

  return (
    <div className="min-h-screen bg-s1 text-white">
      <header className="border-b border-s3/20 px-8 py-4 flex items-center justify-between">
        <Link to="/"><img src="/images/xora.svg" width={100} height={40} alt="Trimix AI" /></Link>
        <Link to="/dashboard" className="text-p3 text-sm hover:text-p1 transition-colors">Dashboard</Link>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-p3 text-xs uppercase tracking-widest mb-2">Project</p><h1 className="text-4xl font-bold">{project.title}</h1></div>
          <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold bg-s3/20 text-p3">{project.status}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-s2 border border-s3/20 rounded-2xl p-6">
            <p className="text-p3 text-xs uppercase tracking-widest mb-3">Render Queue</p>
            <div className="space-y-2">
              {QUEUE_STAGES.map((stage, idx) => (
                <div key={stage} className="flex items-center justify-between border border-white/10 rounded-lg px-3 py-2">
                  <span className="text-sm">{stage}</span>
                  <span className={`text-xs ${idx <= queueStageIndex ? 'text-green-400' : 'text-gray-500'}`}>
                    {idx < queueStageIndex ? 'Done' : idx === queueStageIndex ? 'Active' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-s2 border border-s3/20 rounded-2xl p-6">
            <p className="text-p3 text-xs uppercase tracking-widest mb-3">Scenes</p>
            <div className="space-y-2 max-h-64 overflow-auto">
              {derivedScenes.map((scene, idx) => (
                <div key={scene.id || idx} className="border border-white/10 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400 mb-1">Scene {idx + 1} • {scene.duration || 4}s</p>
                  <p className="text-sm">{scene.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-s2 border border-green-500/20 rounded-2xl p-6">
          <p className="text-p3 text-xs uppercase tracking-widest mb-3">Generated Video</p>
          {project.videoUrl ? <video controls className="w-full rounded-xl" src={project.videoUrl} /> : <p className="text-gray-400 text-sm">No video yet.</p>}
          {shareError && <p className="text-red-400 text-sm mt-3">{shareError}</p>}

          {project.mode === 'text' && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={renderStyle} onChange={(e) => setRenderStyle(e.target.value)} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10">
                  <option value="clean">Style: Clean</option>
                  <option value="bold">Style: Bold</option>
                  <option value="minimal">Style: Minimal</option>
                  <option value="corporate">Style: Corporate</option>
                </select>
                <select value={titleAlign} onChange={(e) => setTitleAlign(e.target.value)} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10">
                  <option value="left">Title Align: Left</option>
                  <option value="center">Title Align: Center</option>
                  <option value="right">Title Align: Right</option>
                </select>
                <select value={descriptionAlign} onChange={(e) => setDescriptionAlign(e.target.value)} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10">
                  <option value="left">Description Align: Left</option>
                  <option value="center">Description Align: Center</option>
                  <option value="right">Description Align: Right</option>
                </select>
                <select value={textVertical} onChange={(e) => setTextVertical(e.target.value)} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10">
                  <option value="top">Text Position: Top</option>
                  <option value="center">Text Position: Center</option>
                  <option value="bottom">Text Position: Bottom</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={backgroundMode} onChange={(e) => setBackgroundMode(e.target.value)} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10">
                  <option value="none">Background: None</option>
                  <option value="color">Background: Color</option>
                  <option value="asset">Background: Asset</option>
                </select>

                {backgroundMode === 'asset' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setAssetPickerOpen(true)}
                      className="rounded-md bg-indigo-500 hover:bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      {backgroundAssetUrl ? 'Change Asset' : 'Choose Asset'}
                    </button>
                    <label className="inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 px-3 py-2 text-sm font-semibold text-white cursor-pointer">
                      {assetLoading ? 'Uploading...' : 'Upload New'}
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleBackgroundUpload} />
                    </label>
                  </>
                )}
              </div>

              {backgroundMode === 'color' && (
                <div className="flex flex-wrap gap-2">
                  {['#0f0f0f', '#1a0533', '#0a1628', '#111827', '#1f2937', '#f5f5f5'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBackgroundColor(color)}
                      className={`h-8 w-8 rounded-full border-2 ${backgroundColor === color ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}

              <input value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} placeholder="Optional music URL (.mp3)" className="w-full rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10" />

              {assetPickerOpen && (
                <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
                  <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-gray-900 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Choose Background Asset</h3>
                      <button type="button" onClick={() => setAssetPickerOpen(false)} className="text-gray-400 hover:text-white">Close</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-auto">
                      {assets.map((asset) => (
                        <button
                          key={asset.$id}
                          type="button"
                          onClick={() => {
                            setBackgroundMode('asset')
                            setBackgroundAssetType((asset.name || '').match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image')
                            setBackgroundAssetUrl(asset.url)
                            setAssetPickerOpen(false)
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 p-2 text-left hover:border-indigo-400"
                        >
                          {asset.url.match(/\.(mp4|mov|webm)(\?|$)/i) ? (
                            <video src={asset.url} className="w-full h-24 object-cover rounded-md mb-2" />
                          ) : (
                            <img src={asset.url} alt={asset.name} className="w-full h-24 object-cover rounded-md mb-2" />
                          )}
                          <p className="text-xs truncate">{asset.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <input type="number" min={1} value={shareExpiryHours} onChange={(e) => setShareExpiryHours(Number(e.target.value || 72))} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10" />
            <input type="password" placeholder="Share password (optional)" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} className="rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10" />
            <label className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={disableDownload} onChange={(e) => setDisableDownload(e.target.checked)} /> Disable download</label>
          </div>

          <div className="flex gap-3 mt-4 flex-wrap">
            <button onClick={handleGenerate} disabled={generating} className="bg-p1 hover:bg-p1/80 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-60">
              {generating ? 'Generating...' : 'Generate / Regenerate'}
            </button>
            <button onClick={handleShare} disabled={shareLoading || !project.videoUrl} className="border border-s3/20 text-p3 hover:text-p1 px-5 py-2.5 rounded-xl text-sm disabled:opacity-60">
              {shareCopied ? 'Link copied!' : shareLoading ? 'Creating link...' : 'Share'}
            </button>
            {genError && <p className="text-red-400 text-sm">{genError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-s2 border border-s3/20 rounded-2xl p-6">
            <p className="text-p3 text-xs uppercase tracking-widest mb-3">Collaborators</p>
            <div className="flex gap-2 mb-3">
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@email.com" className="flex-1 rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10" />
              <button onClick={addCollaborator} className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-md text-sm font-semibold">Invite</button>
            </div>
            <p className="text-xs text-gray-500 mb-2">No SMTP service configured yet, so invite opens your email client.</p>
            <ul className="space-y-2">{collaborators.map((email) => <li key={email} className="text-sm border border-white/10 rounded-md px-3 py-2">{email}</li>)}</ul>
          </div>

          <div className="bg-s2 border border-s3/20 rounded-2xl p-6">
            <p className="text-p3 text-xs uppercase tracking-widest mb-3">Comments</p>
            <div className="flex gap-2 mb-3">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Leave feedback..." className="flex-1 rounded-md bg-white/5 px-3 py-2 text-sm text-white outline outline-1 outline-white/10" />
              <button onClick={addProjectComment} className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-md text-sm font-semibold">Add</button>
            </div>
            <ul className="space-y-2 max-h-56 overflow-auto">
              {comments.map((comment) => (
                <li key={comment.$id} className="border border-white/10 rounded-md px-3 py-2">
                  <p className="text-sm">{comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{comment.author}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link to={`/projects/${id}/edit`} className="text-p3 text-sm hover:text-p1 transition-colors border border-s3/20 px-5 py-2.5 rounded-xl">Edit Project</Link>
          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)} className="text-red-400 text-sm hover:text-red-300 border border-red-500/20 px-5 py-2.5 rounded-xl">Delete Project</button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setShowConfirm(false)} className="text-p3 text-sm px-4 py-2 rounded-xl border border-s3/20">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="bg-red-500/20 text-red-400 text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50">{deleting ? 'Deleting...' : 'Yes, delete'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
