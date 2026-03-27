import { Link } from 'react-router-dom'

const Terms = () => (
  <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
        Back to home
      </Link>
      <h1 className="text-4xl font-bold mt-4 mb-4">Terms of Use</h1>
      <p className="text-gray-300">
        By using Trimix AI, you agree to use the platform responsibly and only upload content you have rights to use.
      </p>
    </div>
  </div>
)

export default Terms
