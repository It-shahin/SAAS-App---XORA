import { Link } from 'react-router-dom'

const Privacy = () => (
  <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
        Back to home
      </Link>
      <h1 className="text-4xl font-bold mt-4 mb-4">Privacy Policy</h1>
      <p className="text-gray-300">
        Trimix AI stores account and project data to provide core functionality. Shared links only expose content you explicitly share.
      </p>
    </div>
  </div>
)

export default Privacy
