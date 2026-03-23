import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProjects, FREE_PLAN_LIMIT } from '../context/ProjectsContext'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const { projects, loading: projectsLoading, getPlanInfo } = useProjects()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [rendersUsed, setRendersUsed] = useState(0)
  const [renderLimit, setRenderLimit] = useState(FREE_PLAN_LIMIT)
  const [plan, setPlan] = useState('free')

  useEffect(() => {
    getPlanInfo().then((info) => {
      setRendersUsed(info.rendersUsed)
      setRenderLimit(info.renderLimit)
      setPlan(info.plan)
    })
  }, [projects])

  const totalRendersUsed = projects.reduce((sum, p) => sum + (p.rendersUsed || 0), 0)
  const totalRendersLeft = Math.max(0, renderLimit - rendersUsed)
  const isLimitReached = totalRendersLeft <= 0

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-gray-900/80">
        <Link to="/">
          <img src="/images/xora.svg" width={120} height={48} alt="Trimix AI" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg"
            >
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-gray-800 border border-white/10 rounded-xl p-2 shadow-xl z-20">
                <Link to="/change-password" className="block px-3 py-2 text-sm hover:bg-white/10 rounded-lg">
                  Settings
                </Link>
                <Link to="/billing" className="block px-3 py-2 text-sm hover:bg-white/10 rounded-lg">
                  Billing
                </Link>
                <Link to="/assets" className="block px-3 py-2 text-sm hover:bg-white/10 rounded-lg">
                  Assets
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg disabled:opacity-60"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 py-12 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Welcome back, {user?.name}</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Manage your video projects and generate new content.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-3">
              <span className="text-gray-400 text-xs uppercase tracking-widest">Total Projects</span>
              <span className="text-4xl font-bold text-white">{projects.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-3">
              <span className="text-gray-400 text-xs uppercase tracking-widest">Videos Generated</span>
              <span className="text-4xl font-bold text-white">{totalRendersUsed}</span>
            </div>
            <div
              className={`bg-white/5 border rounded-2xl p-8 flex flex-col gap-3 ${
                isLimitReached ? 'border-red-500/40' : totalRendersLeft === 1 ? 'border-yellow-500/40' : 'border-white/10'
              }`}
            >
              <span className="text-gray-400 text-xs uppercase tracking-widest">Renders Left</span>
              <span className={`text-4xl font-bold ${isLimitReached ? 'text-red-400' : totalRendersLeft === 1 ? 'text-yellow-400' : 'text-white'}`}>
                {totalRendersLeft} / {renderLimit}
              </span>
              <span className="text-gray-500 text-xs">{isLimitReached ? 'Limit reached. Upgrade to continue.' : `${plan.toUpperCase()} plan`}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Your Projects ({projects.length})</h2>
              <Link to="/projects/new" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl text-sm">
                + New Project
              </Link>
            </div>

            {projectsLoading ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-gray-400 text-lg">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center py-24 gap-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <img src="/images/magic.svg" alt="empty" className="w-8 h-8 opacity-50" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">No projects yet</h3>
                  <p className="text-gray-400 text-lg max-w-md mx-auto">Create your first video project and let AI do the heavy lifting.</p>
                </div>
                <Link to="/projects/new" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl text-sm">
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Link
                    key={project.$id}
                    to={`/projects/${project.$id}`}
                    className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-white/10 transition-all"
                  >
                    <h3 className="font-bold text-xl mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">{project.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800/50 text-gray-300 border border-gray-500/30">
                      {project.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Account</span>
                <span className="text-2xl font-bold text-white">{user?.name}</span>
                <span className="text-gray-400 text-lg block">{user?.email}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Plan</span>
                <span className="text-2xl font-bold text-white capitalize">{plan}</span>
                <Link to="/billing" className="text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition-colors mt-1 block">
                  Manage billing
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10 sm:pt-0 sm:border-t-0 sm:border-l sm:pl-8">
                <Link to="/change-password" className="text-gray-400 hover:text-white font-semibold text-sm transition-colors">
                  Change password
                </Link>
                <Link to="/assets" className="text-gray-400 hover:text-white font-semibold text-sm transition-colors">
                  Assets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
