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
      setError(err.message || 'Something went wrong. Please try again.')
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
        <h2 className="text-white text-2xl font-bold">Forgot password</h2>
        <p className="font-normal text-indigo-400">
          Enter your email and we&apos;ll send you a password reset link.
        </p>

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
          <label className="block text-sm font-medium text-gray-100" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <Link
          to="/login"
          className="font-semibold text-indigo-400 hover:text-indigo-300"
        >
          ← Back to login
        </Link>
      </form>
    </div>
  )
}

export default ForgotPassword
