import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectsContext'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const { projects, loading: projectsLoading, deleteProject } = useProjects()

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      {/* Top navbar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-gray-900/80">
        <Link to="/">
          <img src="/images/xora.svg" width={120} height={48} alt="Xora" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/change-password"
            className="text-gray-400 text-sm hover:text-white font-semibold transition-colors"
          >
            Settings
          </Link>
          <button
            onClick={logout}
            className="text-gray-400 text-sm hover:text-white font-semibold transition-colors"
          >
            Logout
          </button>
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 py-12 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Welcome banner */}
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Welcome back, {user?.name} 👋
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Manage your video projects and generate new content.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-3 hover:border-white/20 transition-all">
              <span className="text-gray-400 text-xs uppercase tracking-widest">Total Projects</span>
              <span className="text-4xl font-bold text-white">{projects.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-3 hover:border-white/20 transition-all">
              <span className="text-gray-400 text-xs uppercase tracking-widest">Videos Generated</span>
              <span className="text-4xl font-bold text-white">0</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-3 hover:border-white/20 transition-all">
              <span className="text-gray-400 text-xs uppercase tracking-widest">Renders Left</span>
              <span className="text-4xl font-bold text-indigo-400">3 / 3</span>
              <span className="text-gray-500 text-xs bg-gray-800/50 px-2 py-1 rounded-full inline-block">Free plan</span>
            </div>
          </div>

          {/* Projects section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Your Projects ({projects.length})</h2>
              <Link
                to="/projects/new"
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
              >
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
                  <p className="text-gray-400 text-lg max-w-md mx-auto">
                    Create your first video project and let AI do the heavy lifting.
                  </p>
                </div>
                <Link
                  to="/projects/new"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm"
                >
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Link
                    key={project.$id}
                    to={`/projects/${project.$id}`}
                    className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-white/10 transition-all shadow-lg hover:shadow-2xl"
                  >
                    <h3 className="font-bold text-xl mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-xs">
                        {new Date(project.$createdAt).toLocaleDateString()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        project.status === 'draft' 
                          ? 'bg-gray-800/50 text-gray-400 border border-gray-500/30' 
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Account info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Account</span>
                <span className="text-2xl font-bold text-white">{user?.name}</span>
                <span className="text-gray-400 text-lg">{user?.email}</span>
              </div>
              <div className="lg:col-span-1">
                <span className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Plan</span>
                <span className="text-2xl font-bold text-white">Free</span>
                <button className="text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition-colors mt-1 block">
                  Upgrade → coming soon
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10 sm:pt-0 sm:border-t-0 sm:border-l sm:pl-8">
                <Link
                  to="/change-password"
                  className="text-gray-400 hover:text-white font-semibold text-sm transition-colors"
                >
                  Change password
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
