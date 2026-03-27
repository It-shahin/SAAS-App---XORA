import { Link } from 'react-router-dom'

const Docs = () => (
  <div className="min-h-screen bg-gray-900 text-white px-6 py-12">
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">
        Back to home
      </Link>
      <h1 className="text-4xl font-bold mt-4 mb-4">Trimix AI Docs</h1>
      <p className="text-gray-300 mb-8">
        Quick start guides and product notes for your MVP.
      </p>

      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-2">1. Create a project</h2>
          <p className="text-gray-400">Go to Dashboard, click New Project, and choose text-to-video or image-to-video.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-2">2. Customize style options</h2>
          <p className="text-gray-400">In Project Details, set title alignment, description alignment, colors, and background.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-2">3. Generate and share</h2>
          <p className="text-gray-400">Generate your video, then create a secure share link with optional password and expiry.</p>
        </div>
      </div>
    </div>
  </div>
)

export default Docs
