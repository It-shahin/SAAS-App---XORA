import { useState } from 'react'
import { account } from '../lib/appwrite'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

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
      return setError('Passwords do not match.')
    }
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    if (!userId || !secret) {
      return setError('Invalid or expired reset link.')
    }

    setLoading(true)
    try {
      await account.updateRecovery(userId, secret, newPassword)
      navigate('/login?reset=success')
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
        <h2 className="text-white text-2xl font-bold">Reset Password</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-p3 text-sm">New password</label>
          <input
            className="input"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-p3 text-sm">Confirm new password</label>
          <input
            className="input"
            type="password"
            placeholder="Repeat new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset password'}
        </button>

        <Link to="/login" className="text-p3 text-sm text-center hover:text-p1 transition-colors">
          ← Back to login
        </Link>
      </form>
    </div>
  )
}

export default ResetPassword
