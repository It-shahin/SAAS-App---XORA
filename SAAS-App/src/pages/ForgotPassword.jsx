import { useState } from 'react'
import { account } from '../lib/appwrite'
import { Link } from 'react-router-dom'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      )
      setSuccess('Recovery email sent! Check your inbox.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-s1">
      <form
        onSubmit={handleSubmit}
        className="bg-s2 p-8 rounded-2xl w-full max-w-md flex flex-col gap-4"
      >
        <h2 className="text-white text-2xl font-bold">Forgot Password</h2>
        <p className="text-p3 text-sm">Enter your email and we'll send you a reset link.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-p3 text-sm">Email address</label>
          <input
            className="input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <Link to="/login" className="text-p3 text-sm text-center hover:text-p1 transition-colors">
          ← Back to login
        </Link>
      </form>
    </div>
  )
}

export default ForgotPassword
