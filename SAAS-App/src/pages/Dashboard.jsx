import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-s1 text-white">

      {/* Top navbar */}
      <header className="border-b border-s3/20 px-8 py-4 flex items-center justify-between">
        <Link to="/">
          <img src="/images/xora.svg" width={100} height={40} alt="logo" />
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/change-password"
            className="text-p3 text-sm hover:text-p1 transition-colors"
          >
            Settings
          </Link>
          <button
            onClick={logout}
            className="text-p3 text-sm hover:text-p1 transition-colors"
          >
            Logout
          </button>
          <div className="size-9 rounded-full bg-p1 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-12">

        {/* Welcome banner */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-p3 text-sm">
            Manage your video projects and generate new content.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-s2 border border-s3/20 rounded-2xl p-6 flex flex-col gap-2">
            <span className="text-p3 text-xs uppercase tracking-widest">Total Projects</span>
            <span className="text-4xl font-bold text-p1">0</span>
          </div>
          <div className="bg-s2 border border-s3/20 rounded-2xl p-6 flex flex-col gap-2">
            <span className="text-p3 text-xs uppercase tracking-widest">Videos Generated</span>
            <span className="text-4xl font-bold text-p1">0</span>
          </div>
          <div className="bg-s2 border border-s3/20 rounded-2xl p-6 flex flex-col gap-2">
            <span className="text-p3 text-xs uppercase tracking-widest">Renders Left</span>
            <span className="text-4xl font-bold text-p1">3 / 3</span>
            <span className="text-p3 text-xs">Free plan</span>
          </div>
        </div>

        {/* Projects section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Your Projects</h2>
          <Link
            to="/projects/new"
            className="bg-p1 hover:bg-p1/80 transition-colors text-white text-sm font-bold px-5 py-2.5 rounded-xl"
          >
            + New Project
          </Link>
        </div>

        {/* Empty state */}
        <div className="bg-s2 border border-s3/20 border-dashed rounded-2xl flex flex-col items-center justify-center py-24 gap-6 text-center">
          <div className="size-16 rounded-full bg-s3/20 flex items-center justify-center">
            <img src="/images/magic.svg" alt="empty" className="size-8 opacity-40" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">No projects yet</h3>
            <p className="text-p3 text-sm max-w-xs">
              Create your first video project and let AI do the heavy lifting.
            </p>
          </div>
          <Link
            to="/projects/new"
            className="bg-p1 hover:bg-p1/80 transition-colors text-white text-sm font-bold px-6 py-3 rounded-xl"
          >
            Create your first project
          </Link>
        </div>

        {/* Account info */}
        <div className="mt-12 bg-s2 border border-s3/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-p3 text-xs uppercase tracking-widest">Account</span>
            <span className="text-white font-bold">{user?.name}</span>
            <span className="text-p3 text-sm">{user?.email}</span>
          </div>
          <div className="flex flex-col gap-1 sm:text-right">
            <span className="text-p3 text-xs uppercase tracking-widest">Plan</span>
            <span className="text-white font-bold">Free</span>
            <button className="text-p1 text-sm hover:underline transition-colors text-left sm:text-right">
              Upgrade → coming soon
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/change-password"
              className="text-p3 text-sm hover:text-p1 transition-colors"
            >
              Change password
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
