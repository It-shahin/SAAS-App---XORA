import { Link } from 'react-router-dom'

const NotFound = () => (
  <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-6 text-center px-6">
    <h1 className="text-6xl font-bold text-white">404</h1>
    <p className="text-gray-400 text-lg">Page not found.</p>
    <Link to="/" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
      Go Home
    </Link>
  </div>
)

export default NotFound
