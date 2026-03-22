import { useState } from 'react'
import { account } from '../lib/appwrite'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { getSafeAuthError } from '../lib/authErrors'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const userId = searchParams.get('userId')
  const secret = searchParams.get('secret')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (!userId || !secret) {
      setError('Invalid or expired reset link.')
      return
    }

    setLoading(true)
    try {
      await account.updateRecovery(userId, secret, newPassword)
      navigate('/login?reset=success')
    } catch (err) {
      setError(getSafeAuthError(err, 'Could not reset password. Please request a new reset link.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-s1">
      <form onSubmit={handleSubmit} className="bg-s2 p-8 rounded-2xl w-full max-w-md flex flex-col gap-4">
        <h2 className="text-white text-2xl font-bold">Reset Password</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-p3 text-sm" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-p3 text-sm" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm"
            type="password"
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <button
          className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset password'}
        </button>

        <Link to="/login" className="text-p3 text-sm text-center hover:text-p1 transition-colors">
          Back to login
        </Link>
      </form>
    </div>
  )
}

export default ResetPassword

